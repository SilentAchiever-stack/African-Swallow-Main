const Reservation = require('../Model/Reservation');

// POST /api/reservations  — public, customer books a table
const createReservation = async (req, res) => {
    try {
        const { name, email, phone, date, time, guests, notes } = req.body;

        if (!name || !email || !phone || !date || !time || !guests) {
            return res.status(400).json({
                success: false,
                message: 'All fields (name, email, phone, date, time, guests) are required.'
            });
        }

        // Prevent past date bookings
        const reservationDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (reservationDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Reservation date cannot be in the past.'
            });
        }

        const reservation = await Reservation.create({
            name, email, phone,
            date: reservationDate,
            time, guests, notes
        });

        return res.status(201).json({
            success: true,
            message: `Reservation confirmed for ${name} on ${date} at ${time}. We'll call you to confirm!`,
            data: reservation
        });

    } catch (error) {
        console.error('Create reservation error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};

// GET /api/reservations  — admin only
const getAllReservations = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const skip = (page - 1) * limit;
        const total = await Reservation.countDocuments(filter);

        const reservations = await Reservation.find(filter)
            .sort({ date: 1, time: 1 })   // chronological order
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            total,
            data: reservations
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};

// PATCH /api/reservations/:id/status  — admin only
const updateReservationStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `Reservation for ${reservation.name} updated to "${status}".`,
            data: reservation
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};

// DELETE /api/reservations/:id  — admin only
const deleteReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndDelete(req.params.id);

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `Reservation for ${reservation.name} deleted.`
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};

module.exports = { createReservation, getAllReservations, updateReservationStatus, deleteReservation };