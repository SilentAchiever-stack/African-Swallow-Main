const express = require('express');
const router = express.Router();
const {
    getAllMenuItems,
    getAllMenuItemsAdmin,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    seedMenu
} = require('../controller/Menucontroller')  // change Controller → controller
const { protect, superAdminOnly } = require('../MiddleWare/authMiddleware')  // change Middleware → MiddleWare



// PUBLIC
router.get('/', getAllMenuItems);                          // GET /api/menu

// ADMIN PROTECTED
router.get('/admin', protect, getAllMenuItemsAdmin);       // GET /api/menu/admin
router.post('/', protect, createMenuItem);                 // POST /api/menu
router.post('/seed', protect, seedMenu);                   // POST /api/menu/seed
router.patch('/:id', protect, updateMenuItem);             // PATCH /api/menu/:id
router.delete('/:id', protect, superAdminOnly, deleteMenuItem); // DELETE /api/menu/:id

module.exports = router;