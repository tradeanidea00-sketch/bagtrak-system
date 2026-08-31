const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Register
const register = async (req, res) => {
    console.log("📩 Received body:", req.body);

    try {
        const { name, email, password, phone } = req.body;

        // Check if user exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, phone) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, name, email`,
            [name, email, password_hash, phone]
        );

        const user = result.rows[0];

        // Generate JWT
        const token = jwt.sign(
    { id: user.id, email: user.email },
    'Bagtrack_Secret_Key_2026',  
    { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error("❌ Register Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
    { id: user.id, email: user.email },
    'Bagtrack_Secret_Key_2026', 
    { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { register, login };