const cloudinary = require('../config/clodinary');

// POST /api/upload  — admin only, uploads image to Cloudinary
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded.'
            });
        }

        // Upload buffer directly to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'africana-swallow/menu',
                    transformation: [
                        { width: 800, height: 600, crop: 'fill' },
                        { quality: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        return res.status(200).json({
            success: true,
            message: 'Image uploaded successfully.',
            url: result.secure_url,
            publicId: result.public_id
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message: 'Image upload failed.',
            actualError: error.message
        });
    }
};

module.exports = { uploadImage };