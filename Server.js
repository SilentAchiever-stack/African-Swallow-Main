require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./database/db');
const uploadRoutes = require('./Route/uploadRoutes');  // top with other routes
                 // with other app.use routes
// Route files
const authRoutes = require('./Route/Authroutes');
const menuRoutes = require('./Route/menuroute');
const orderRoutes = require('./Route/Orderroutes');
const reservationRoutes = require('./Route/Reservationroutes');


const app = express();

// ── Connect to MongoDB
connectDB();

// ── Middleware
app.use(cors({
    origin:'https://african-frontend.vercel.app',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/upload', uploadRoutes); 
// ── Serve frontend + admin dashboard from AdminDashboard folder
app.use('/admin', express.static(__dirname + '/AdminDashboard'));
// Customer frontend
app.get('/menu', (req, res) => {
    res.sendFile(__dirname + '/AdminDashboard/africana-swallow.html');
});

// ── API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);

// ── Health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🍛 Africana Swallow API is running!'
    });
});

// ── 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(`🌍 Frontend: http://localhost:${PORT}/admin/africana-swallow.html`);
    console.log(`🔑 Seed admin: POST http://localhost:${PORT}/api/auth/seed\n`);
});

/* Customer site: http://localhost:3000/menu
Admin dashboard: http://localhost:3000/admin */