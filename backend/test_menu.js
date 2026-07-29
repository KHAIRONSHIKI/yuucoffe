const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env' });

async function testUpdateMenu() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) return console.log('No admin found');

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: admin.role },
    process.env.JWT_SECRET || 'yucoffe_secret_key',
    { expiresIn: '1d' }
  );

  const payload = {
    name: 'Test Menu Edited',
    description: 'Edited description',
    price: 20000,
    category: 'MAKANAN',
    image: '',
    isAvailable: false
  };

  try {
    const res = await fetch('http://localhost:5000/api/menu/5', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log('Update Status:', res.status);
    console.log('Update Response:', data);

    const delRes = await fetch('http://localhost:5000/api/menu/5', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Delete Status:', delRes.status);
    console.log('Delete Response:', await delRes.json());

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testUpdateMenu();
