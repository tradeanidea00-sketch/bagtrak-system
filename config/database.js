const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'bagtrak_db',
    user: 'postgres',
    password: 'Bagtrack', 
});

module.exports = { pool };