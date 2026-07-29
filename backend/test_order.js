const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabase() {
  // Tampilkan semua orders dan status isTableCleared
  const orders = await prisma.order.findMany({
    include: { customer: true },
    orderBy: { id: 'desc' }
  });

  console.log('\n=== SEMUA ORDERS ===');
  orders.forEach(o => {
    console.log(`Order #${o.id} | Meja: ${o.customer?.tableNum} | Status: ${o.status} | isTableCleared: ${o.isTableCleared}`);
  });

  // Tampilkan meja yang dianggap "terisi" oleh logic kasir
  const occupied = orders.filter(o => o.isTableCleared === false);
  console.log('\n=== MEJA YANG DIANGGAP TERISI (isTableCleared=false) ===');
  occupied.forEach(o => {
    console.log(`Order #${o.id} | Meja: ${o.customer?.tableNum} | Customer: ${o.customer?.name}`);
  });

  console.log('\n=== SELESAI ===');
}

cleanDatabase().catch(console.error).finally(() => prisma.$disconnect());
