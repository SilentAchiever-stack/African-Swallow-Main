const jwt = require('jsonwebtoken');
const Admin = require('../Model/Admin');

const protect = async (req, res, next) => {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized. No token provided.'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach admin info to request
        req.admin = await Admin.findById(decoded.id).select('-password');

        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: 'Admin account no longer exists.'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token is invalid or expired. Please log in again.'
        });
    }
};

// Only superAdmin can perform certain actions (e.g. delete menu items)
const superAdminOnly = (req, res, next) => {
    if (req.admin.role !== 'superAdmin') {
        return res.status(403).json({
            success: false,
            message: 'This action requires Super Admin privileges.'
        });
    }
    next();
};

module.exports = { protect, superAdminOnly };