const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Buat Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  // Buat Kasir
  const kasirPassword = await bcrypt.hash('kasir123', 10);
  await prisma.user.upsert({
    where: { username: 'kasir' },
    update: {},
    create: {
      username: 'kasir',
      password: kasirPassword,
      role: 'KASIR'
    }
  });

  // Buat Dapur
  const dapurPassword = await bcrypt.hash('dapur123', 10);
  await prisma.user.upsert({
    where: { username: 'dapur' },
    update: {},
    create: {
      username: 'dapur',
      password: dapurPassword,
      role: 'DAPUR'
    }
  });

  // Buat Menu Awal
  const menus = [
    { name: 'Espresso', description: 'Kopi hitam murni', price: 15000, category: 'MINUMAN', image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500&auto=format&fit=crop' },
    { name: 'Cappuccino', description: 'Espresso dengan susu foam', price: 25000, category: 'MINUMAN', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop' },
    { name: 'Croissant', description: 'Roti lapis mentega ala Prancis', price: 20000, category: 'SNACK', image: 'https://images.unsplash.com/photo-1555507036-ab1e4006aaeb?w=500&auto=format&fit=crop' },
    { name: 'Nasi Goreng Spesial', description: 'Nasi goreng dengan telur dan ayam', price: 35000, category: 'MAKANAN', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop' }
  ];

  for (const menu of menus) {
    await prisma.menu.create({ data: menu });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
