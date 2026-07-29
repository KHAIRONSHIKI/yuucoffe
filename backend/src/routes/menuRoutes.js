const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

router.get('/', menuController.getAllMenu);

// Admin Only
router.post('/', verifyToken, verifyRole(['ADMIN']), menuController.createMenu);
router.put('/:id', verifyToken, verifyRole(['ADMIN']), menuController.updateMenu);
router.delete('/:id', verifyToken, verifyRole(['ADMIN']), menuController.deleteMenu);

module.exports = router;
