const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controller/uploadController');
const { protect } = require('../MiddleWare/authMiddleware')  // change Middleware → MiddleWare
const upload = require('../MiddleWare/multerMiddleware');


// POST /api/upload  — admin only
router.post('/', protect, upload.single('image'), uploadImage);

module.exports = router;