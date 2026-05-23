const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['rice', 'swallow', 'soup', 'sides'],
        lowercase: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    popular: {
        type: Boolean,
        default: false
    },
    available: {
        type: Boolean,
        default: true  // Admin can mark items as unavailable without deleting them
    }
}, { timestamps: true });

module.exports = mongoose.model('Menuitem', menuItemSchema);