const Order = require('../Model/order');
const MenuItem = require('../Model/menuitem');

// POST /api/orders  — public, customer places an order
const placeOrder = async (req, res) => {
    try {
        const { customerName, customerPhone, customerEmail, deliveryAddress, orderType, items, notes } = req.body;

        // Validate required fields
        if (!customerName || !customerPhone) {
            return res.status(400).json({
                success: false,
                message: 'Customer name and phone number are required.'
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must contain at least one item.'
            });
        }

        // Verify each item exists in DB and build order items with price snapshots
        const orderItems = [];
        let totalAmount = 0;

        for (const cartItem of items) {
            const menuItem = await MenuItem.findById(cartItem.menuItemId);

            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    message: `Menu item not found: ${cartItem.menuItemId}`
                });
            }

            if (!menuItem.available) {
                return res.status(400).json({
                    success: false,
                    message: `"${menuItem.name}" is currently unavailable.`
                });
            }

            const subtotal = menuItem.price * cartItem.quantity;
            totalAmount += subtotal;

            orderItems.push({
                menuItem: menuItem._id,
                name: menuItem.name,       // snapshot — price won't change if admin edits it later
                price: menuItem.price,
                quantity: cartItem.quantity,
                subtotal
            });
        }

        const order = await Order.create({
            customerName,
            customerPhone,
            customerEmail,
            deliveryAddress,
            orderType: orderType || 'pickup',
            items: orderItems,
            totalAmount,
            notes
        });

        return res.status(201).json({
            success: true,
            message: `Order placed successfully! Your order number is ${order.orderNumber}.`,
            data: {
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount,
                status: order.status,
                estimatedTime: '30-45 minutes'
            }
        });

    }  catch (error) {
    console.error('Place order error:', error);
    return res.status(500).json({ 
        success: false, 
        message: 'Something went wrong placing your order.',
        actualError: error.message  // ← add this
    });
}
};

// GET /api/orders  — admin only, get all orders with optional filters
const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const skip = (page - 1) * limit;
        const total = await Order.countDocuments(filter);

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: orders
        });

    } catch (error) {
        console.error('Get orders error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};

// GET /api/orders/:id  — admin only, single order detail
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        return res.status(200).json({ success: true, data: order });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};

// PATCH /api/orders/:id/status  — admin only, update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        return res.status(200).json({
            success: true,
            message: `Order ${order.orderNumber} status updated to "${status}".`,
            data: order
        });

    } catch (error) {
        console.error('Update status error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};

// GET /api/orders/stats  — admin only, dashboard summary numbers
const getOrderStats = async (req, res) => {
    try {
        const total = await Order.countDocuments();
        const pending = await Order.countDocuments({ status: 'pending' });
        const confirmed = await Order.countDocuments({ status: 'confirmed' });
        const preparing = await Order.countDocuments({ status: 'preparing' });
        const delivered = await Order.countDocuments({ status: 'delivered' });
        const cancelled = await Order.countDocuments({ status: 'cancelled' });

        // Total revenue from delivered orders
        const revenueResult = await Order.aggregate([
            { $match: { status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        return res.status(200).json({
            success: true,
            data: { total, pending, confirmed, preparing, delivered, cancelled, totalRevenue }
        });

    } catch (error) {
        console.error('Stats error:', error);
        return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
};

module.exports = { placeOrder, getAllOrders, getOrderById, updateOrderStatus, getOrderStats };