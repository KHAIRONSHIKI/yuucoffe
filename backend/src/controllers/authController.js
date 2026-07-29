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

    // Cek meja — SAMA PERSIS dengan logika di dashboard Kasir
    // Kasir pakai: orders.find(o => parseInt(o.customer?.tableNum) === tableNumInt && o.isTableCleared === false)
    const tableInt = parseInt(tableNum);
    const activeOrderAtTable = await prisma.order.findFirst({
      where: {
        isTableCleared: false,
        customer: {
          tableNum: {
            in: [
              String(tableInt),                     // "1"
              String(tableInt).padStart(2, '0'),    // "01"
              String(tableInt).padStart(3, '0'),    // "001"
            ]
          }
        }
      }
    });

    if (activeOrderAtTable) {
      return res.status(409).json({
        message: `Mohon maaf, meja ${String(tableInt).padStart(2, '0')} sedang digunakan. Silahkan pilih meja yang lain.`
      });
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

