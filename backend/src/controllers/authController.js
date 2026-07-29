const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, role: user.role, username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Gagal login', error: error.message });
  }
};

exports.guestLogin = async (req, res) => {
  try {
    const { name, tableNum } = req.body;
    if (!name || !tableNum) {
      return res.status(400).json({ message: 'Nama dan Nomor Meja wajib diisi' });
    }

    // Cek apakah meja sedang digunakan (ada pesanan aktif)
    // Gunakan perbandingan numerik agar "09" == "9"
    const tableInt = parseInt(tableNum);
    const allCustomers = await prisma.customer.findMany();
    const customersAtTable = allCustomers.filter(c => parseInt(c.tableNum) === tableInt);
    const customerIds = customersAtTable.map(c => c.id);

    if (customerIds.length > 0) {
      const activeOrderAtTable = await prisma.order.findFirst({
        where: {
          customerId: { in: customerIds },
          status: { notIn: ['COMPLETED', 'CANCELLED'] }
        }
      });

      if (activeOrderAtTable) {
        return res.status(409).json({
          message: `Mohon maaf, meja ${tableNum} sedang digunakan. Silahkan pilih meja yang lain.`
        });
      }
    }

    const customer = await prisma.customer.create({
      data: { name, tableNum }
    });

    const token = jwt.sign(
      { id: customer.id, name: customer.name, tableNum: customer.tableNum, role: 'CUSTOMER' },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, customer });
  } catch (error) {
    res.status(500).json({ message: 'Gagal masuk sebagai guest', error: error.message });
  }
};

