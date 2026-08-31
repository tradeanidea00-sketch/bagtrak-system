const { pool } = require('../config/database');

// Create a new bag (check-in)
const createBag = async (req, res) => {
    try {
        const {
            tag_number,
            airline_id,
            flight_number_original,
            flight_number_final,
            origin_airport_code,
            destination_airport_code,
            last_location
        } = req.body;

        const passenger_id = req.user.id;

        // Check if bag already exists
        const existingBag = await pool.query(
            'SELECT * FROM bags WHERE tag_number = $1',
            [tag_number]
        );
        if (existingBag.rows.length > 0) {
            return res.status(400).json({ message: 'Bag already exists' });
        }

        // Create bag (airline_id optional)
        const result = await pool.query(
            `INSERT INTO bags (
                tag_number, passenger_id, airline_id, 
                flight_number_original, flight_number_final,
                origin_airport_code, destination_airport_code,
                status, last_location
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`,
            [tag_number, passenger_id, airline_id || null,
             flight_number_original, flight_number_final,
             origin_airport_code, destination_airport_code,
             'checked_in', last_location]
        );

        const bag = result.rows[0];

        // Add initial scan
        await pool.query(
            `INSERT INTO bag_scans (bag_id, scan_location, airport_code, scan_type, scanner_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [bag.id, last_location, origin_airport_code, 'check_in', 'mobile_app']
        );

        res.status(201).json({
            success: true,
            bag
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Track a bag by tag number
const trackBag = async (req, res) => {
    try {
        const { tag_number } = req.params;

        const result = await pool.query(
            `SELECT b.*, u.name as passenger_name, u.email as passenger_email,
                    a.name as airline_name
             FROM bags b
             LEFT JOIN users u ON b.passenger_id = u.id
             LEFT JOIN airlines a ON b.airline_id = a.id
             WHERE b.tag_number = $1`,
            [tag_number]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Bag not found' });
        }

        const bag = result.rows[0];

        // Get scan history
        const scans = await pool.query(
            `SELECT * FROM bag_scans WHERE bag_id = $1 ORDER BY scanned_at ASC`,
            [bag.id]
        );

        res.json({
            success: true,
            bag,
            scans: scans.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all bags for the logged-in passenger
const getMyBags = async (req, res) => {
    try {
        const passenger_id = req.user.id;

        const result = await pool.query(
            `SELECT * FROM bags WHERE passenger_id = $1 ORDER BY created_at DESC`,
            [passenger_id]
        );

        res.json({
            success: true,
            bags: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Add a scan (for ground staff)
const addScan = async (req, res) => {
    try {
        const { bag_id, scan_location, airport_code, scan_type, scanner_id } = req.body;

        const scanResult = await pool.query(
            `INSERT INTO bag_scans (bag_id, scan_location, airport_code, scan_type, scanner_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [bag_id, scan_location, airport_code, scan_type, scanner_id]
        );

        // Update bag status
        let status = 'in_transit';
        if (scan_type === 'check_in') status = 'checked_in';
        else if (scan_type === 'loading') status = 'loaded';
        else if (scan_type === 'transfer') status = 'in_transit';
        else if (scan_type === 'arrival') status = 'arrived';

        await pool.query(
            `UPDATE bags SET status = $1, last_location = $2, last_scanned_at = CURRENT_TIMESTAMP 
             WHERE id = $3`,
            [status, scan_location, bag_id]
        );

        res.json({
            success: true,
            scan: scanResult.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createBag, trackBag, getMyBags, addScan };