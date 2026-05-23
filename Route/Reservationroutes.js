const express = require('express');
const router = express.Router();
const {
    createReservation,
    getAllReservations,
    updateReservationStatus,
    deleteReservation
} = require('../controller/Reservationcontroller');
const { protect } = require('../MiddleWare/authMiddleware')  // change Middleware → MiddleWare

// PUBLIC
router.post('/', createReservation);                               // POST /api/reservations

// ADMIN PROTECTED
router.get('/', protect, getAllReservations);                       // GET /api/reservations
router.patch('/:id/status', protect, updateReservationStatus);     // PATCH /api/reservations/:id/status
router.delete('/:id', protect, deleteReservation);                 // DELETE /api/reservations/:id

module.exports = router;