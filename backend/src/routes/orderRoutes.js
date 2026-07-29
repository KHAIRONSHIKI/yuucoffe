const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

// Kasir & Dapur
router.get('/', verifyToken, verifyRole(['KASIR', 'DAPUR', 'ADMIN']), orderController.getOrders);
router.put('/:id/status', verifyToken, verifyRole(['KASIR', 'DAPUR']), orderController.updateOrderStatus);
router.put('/:id/payment', verifyToken, verifyRole(['KASIR']), orderController.confirmPayment);
router.put('/clear-table/:tableNum', verifyToken, verifyRole(['KASIR']), orderController.clearTable);

// Customer
router.post('/', verifyToken, orderController.createOrder); // anyone logged in
router.get('/my-orders', verifyToken, orderController.getCustomerOrders);
router.put('/:id/cancel', verifyToken, orderController.cancelOrder);

module.exports = router;
