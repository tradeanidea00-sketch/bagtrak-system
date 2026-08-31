const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
console.log('PORT from env:', process.env.PORT);
console.log('Using PORT:', PORT);

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'bagtrak_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Bagtrack',
});

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const bagRoutes = require('./routes/bagRoutes');

// Root route
app.get('/', (req, res) => {
    res.json({ status: 'OK', message: 'BAGTRAK API is running!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bags', bagRoutes);

// Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'BAGTRAK API is running!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});