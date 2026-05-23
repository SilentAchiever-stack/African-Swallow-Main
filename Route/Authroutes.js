const express = require('express');
const router = express.Router();
const { login, seedAdmin, getMe } = require('../controller/Authcontroller');
const { protect } = require('../MiddleWare/Authmiddleware');

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/seed  — run once to create first admin
router.post('/seed', seedAdmin);

// GET /api/auth/me  — protected
router.get('/me', protect, getMe);

module.exports = router;