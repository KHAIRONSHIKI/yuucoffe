const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getIo } = require('../services/socketService');

exports.getAllMenu = async (req, res) => {
  try {
    const menus = await prisma.menu.findMany();
    res.json(menus);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data menu', error: error.message });
  }
};

exports.createMenu = async (req, res) => {
  try {
    const { name, description, price, category, image, isAvailable, options } = req.body;
    const newMenu = await prisma.menu.create({
      data: { 
        name, 
        description: description || '', 
        price: price ? parseInt(price) : 0, 
        category, 
        image: image || '',
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        options: options || []
      }
    });
    // Notify all customer pages to refresh menu list
    getIo().emit('menu_updated');
    res.status(201).json(newMenu);
  } catch (error) {
    console.error("CREATE MENU ERROR:", error);
    res.status(500).json({ message: 'Gagal menambah menu', error: error.message });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, isAvailable, image, options } = req.body;
    
    const updatedMenu = await prisma.menu.update({
      where: { id: parseInt(id) },
      data: { 
        name, 
        description: description || '', 
        price: price !== undefined ? parseInt(price) : undefined, 
        category, 
        isAvailable, 
        image: image || '',
        options: options !== undefined ? options : undefined
      }
    });
    // Notify all customer pages to refresh menu (availability, stock, etc)
    getIo().emit('menu_updated');
    res.json(updatedMenu);
  } catch (error) {
    console.error("UPDATE MENU ERROR:", error);
    res.status(500).json({ message: 'Gagal update menu', error: error.message });
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const menuId = parseInt(id);
    
    // Hapus data orderItem terkait terlebih dahulu agar tidak kena foreign key constraint
    await prisma.orderItem.deleteMany({
      where: { menuId: menuId }
    });
    
    await prisma.menu.delete({ where: { id: menuId } });
    // Notify all customer pages to refresh menu list
    getIo().emit('menu_updated');
    res.json({ message: 'Menu berhasil dihapus' });
  } catch (error) {
    console.error("DELETE MENU ERROR:", error);
    res.status(500).json({ message: 'Gagal menghapus menu', error: error.message });
  }
};
