const jwt = require('jsonwebtoken');
const Admin = require('../Model/Admin');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide email and password.'
        });
    }

    try {
        // Find admin by email
        const admin = await Admin.findOne({ email: email.toLowerCase() });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Check password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Return token and admin info
        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token: generateToken(admin._id),
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
        success: false,
        message: 'Something went wrong during login.',
        actualError: error.message  // ← add this
    });
};
}

// POST /api/auth/seed  — creates the first admin from .env values (run once)
const seedAdmin = async (req, res) => {
    try {
        const existing = await Admin.findOne({ email: process.env.ADMIN_EMAIL });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Admin already exists. Seed can only run once.'
            });
        }

        const admin = await Admin.create({
            name: process.env.ADMIN_NAME || 'Super Admin',
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            role: 'superAdmin'
        });

        return res.status(201).json({
            success: true,
            message: `Admin created. Email: ${admin.email}. You can now log in.`
        });

    } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({
        success: false,
        message: 'Failed to seed admin.'
    });
}
};

// GET /api/auth/me  — returns current logged-in admin info
const getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        admin: req.admin
    });
};

// PATCH /api/auth/change-password — protected
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Please provide current and new password.'
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'New password must be at least 6 characters.'
        });
    }

    try {
        const admin = await Admin.findById(req.admin._id).select('+password');

        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect.'
            });
        }

        admin.password = newPassword;
        await admin.save();

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully.'
        });

    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong.'
        });
    }
};
module.exports = { login, seedAdmin, getMe, changePassword };