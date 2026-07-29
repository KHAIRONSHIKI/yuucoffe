const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getIo } = require('../services/socketService');

exports.createOrder = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;
    const customerId = req.user.id;

    // Calculate total amount
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const menu = await prisma.menu.findUnique({ where: { id: item.menuId } });
      if (!menu) throw new Error(`Menu dengan id ${item.menuId} tidak ditemukan`);
      
      let price = menu.price;
      
      if (item.optionName && menu.options) {
        // Menu dengan opsi/varian — kurangi stok dari dalam options JSON
        let opts = [];
        if (Array.isArray(menu.options)) {
          opts = menu.options;
        } else if (typeof menu.options === 'string') {
          try { opts = JSON.parse(menu.options); } catch (e) {}
        } else if (typeof menu.options === 'object') {
          opts = menu.options;
        }

        const selectedOptIdx = opts.findIndex(o => o.name === item.optionName);
        if (selectedOptIdx !== -1) {
          const selectedOpt = opts[selectedOptIdx];
          price += parseInt(selectedOpt.priceModifier) || 0;

          // Validasi stok opsi
          const currentStock = parseInt(selectedOpt.stock) || 0;
          if (currentStock < item.quantity) {
            return res.status(400).json({ message: `Stok opsi "${selectedOpt.name}" untuk menu "${menu.name}" tidak mencukupi (tersisa ${currentStock}).` });
          }

          // Deduct stock opsi
          const newStock = Math.max(0, currentStock - item.quantity);
          opts[selectedOptIdx] = { ...selectedOpt, stock: newStock };

          // Save updated options back to menu
          await prisma.menu.update({
            where: { id: menu.id },
            data: { options: opts }
          });
        }
      } else {
        // Menu tanpa opsi — kurangi stok dari field `stock`
        const currentStock = menu.stock ?? 999;
        if (currentStock < item.quantity) {
          return res.status(400).json({ message: `Stok menu "${menu.name}" tidak mencukupi (tersisa ${currentStock}).` });
        }

        await prisma.menu.update({
          where: { id: menu.id },
          data: { stock: Math.max(0, currentStock - item.quantity) }
        });
      }

      totalAmount += price * item.quantity;
      
      orderItemsData.push({
        menuId: menu.id,
        quantity: item.quantity,
        price: price,
        note: item.note || ''
      });
    }


    const newOrder = await prisma.order.create({
      data: {
        customerId,
        totalAmount,
        items: {
          create: orderItemsData
        },
        payment: {
          create: {
            paymentMethod: paymentMethod || 'QRIS',
            amount: totalAmount,
            status: 'UNPAID' // If QRIS, waiting for cashier or webhook confirmation
          }
        }
      },
      include: {
        items: { include: { menu: true } },
        payment: true,
        customer: true
      }
    });

    // Emit event to Cashier
    const io = getIo();
    io.emit('new_order', newOrder);
    // Notify all customer pages to refresh menu stock
    io.emit('menu_updated');

    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat pesanan', error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query; // filter by status if needed
    
    let whereCondition = {};
    if (status) {
      whereCondition.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereCondition,
      include: {
        items: { include: { menu: true } },
        payment: true,
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil pesanan', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // PENDING, COOKING, READY, COMPLETED, CANCELLED

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { 
        items: { include: { menu: true } },
        payment: true,
        customer: true 
      }
    });

    // Emit real-time notification to the specific customer
    const io = getIo();
    io.emit(`order_status_${updatedOrder.customerId}`, updatedOrder);
    
    // Also broadcast to Kitchen and Cashier to update their views
    io.emit('order_updated', updatedOrder);

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Gagal update status pesanan', error: error.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { id } = req.params; // payment id or order id
    
    const updatedPayment = await prisma.payment.update({
      where: { orderId: parseInt(id) },
      data: { status: 'PAID' }
    });

    // Tell kitchen that order is paid and ready to process (optional flow depending on business logic, here we assume Kitchen waits for PAID, or they can start anytime)
    const io = getIo();
    io.emit('payment_confirmed', { orderId: parseInt(id) });

    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: 'Gagal konfirmasi pembayaran', error: error.message });
  }
};

exports.clearTable = async (req, res) => {
  try {
    const { tableNum } = req.params;
    const tableInt = parseInt(tableNum);

    // Find all customers with this table number (match both "2" and "02")
    const allCustomers = await prisma.customer.findMany();
    const customers = allCustomers.filter(c => parseInt(c.tableNum) === tableInt);

    const customerIds = customers.map(c => c.id);

    if (customerIds.length === 0) {
      return res.json({ message: `Tidak ada pelanggan di Meja ${tableNum}` });
    }

    // Update all their orders where isTableCleared is false
    await prisma.order.updateMany({
      where: { 
        customerId: { in: customerIds },
        isTableCleared: false
      },
      data: { isTableCleared: true }
    });

    // Emit event so ALL Kasir clients update their UI
    const io = getIo();
    io.emit('table_cleared', { tableNum: String(tableInt) });

    res.json({ message: `Meja ${tableNum} berhasil dikosongkan` });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengosongkan meja', error: error.message });
  }
};

exports.getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        items: { include: { menu: true } },
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil pesanan pelanggan', error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    if (order.customerId !== req.user.id) return res.status(403).json({ message: 'Tidak diizinkan' });
    if (order.status !== 'PENDING') return res.status(400).json({ message: 'Pesanan sudah diproses' });

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status: 'CANCELLED' }
    });

    const io = getIo();
    io.emit('order_updated', updatedOrder);

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Gagal membatalkan pesanan', error: error.message });
  }
};
