const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(50) PRIMARY KEY,
        documento VARCHAR(50),
        name VARCHAR(200),
        card_no VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attendance_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
        user_name VARCHAR(200),
        event_time TIMESTAMP,
        event_type VARCHAR(100),
        major_type INTEGER,
        minor_type INTEGER,
        card_no VARCHAR(100),
        serial_no INTEGER,
        user_type VARCHAR(100),
        attendance_status VARCHAR(100),
        raw_data JSONB,
        device_id INTEGER,
        device_name VARCHAR(200),
        sede_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_time, serial_no)
      );
    `);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
};

module.exports = { pool, initDb };
