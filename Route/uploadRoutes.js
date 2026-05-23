const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controller/uploadController');
const { protect } = require('../Middleware/authMiddleware');
const upload = require('../Middleware/multerMiddleware');

// POST /api/upload  — admin only
router.post('/', protect, upload.single('image'), uploadImage);

module.exports = router;