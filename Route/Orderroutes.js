const express = require('express');
const router = express.Router();

const {
    placeOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStats
} =require('../controller/Ordercontroller')  // change Controller → controller;
const { protect } = require('../MiddleWare/Authmiddleware');



// PUBLIC
router.post('/', placeOrder);                                    // POST /api/orders

// ADMIN PROTECTED
router.get('/', protect, getAllOrders);                           // GET /api/orders
router.get('/stats', protect, getOrderStats);                    // GET /api/orders/stats
router.get('/:id', protect, getOrderById);                       // GET /api/orders/:id
router.patch('/:id/status', protect, updateOrderStatus);         // PATCH /api/orders/:id/status

module.exports = router;