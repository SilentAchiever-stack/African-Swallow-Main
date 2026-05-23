const mongoose = require('mongoose');

// Each item inside an order
const orderItemSchema = new mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    name: { type: String, required: true },   // snapshot of name at time of order
    price: { type: Number, required: true },  // snapshot of price at time of order
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
    // Customer info
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerPhone: {
        type: String,
        required: true,
        trim: true
    },
    customerEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    deliveryAddress: {
        type: String,
        trim: true
    },
    orderType: {
        type: String,
        enum: ['delivery', 'pickup', 'dine-in'],
        default: 'pickup'
    },

    // Order contents
    items: [orderItemSchema],

    // Financials
    totalAmount: {
        type: Number,
        required: true
    },

    // Order lifecycle
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
        default: 'pending'
    },

    notes: {
        type: String,
        trim: true
    },

    // Reference number shown to customer e.g. #ASW-0042
    orderNumber: {
        type: String,
        unique: true
    }
}, { timestamps: true });

// Auto-generate a readable order number before saving
orderSchema.pre('save', async function () {
    if (this.orderNumber) return;
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ASW-${String(count + 1).padStart(4, '0')}`;
});
module.exports = mongoose.model('Order', orderSchema);