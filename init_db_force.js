const { pool } = require('./db');

const initSchema = async () => {
  console.log('Iniciando limpieza y creación de tablas...');
  const client = await pool.connect();
  try {
    // 1. Borrar tablas existentes para asegurar los nuevos campos
    await client.query('DROP TABLE IF EXISTS attendance_logs CASCADE;');
    await client.query('DROP TABLE IF EXISTS users CASCADE;');

    // 2. Crear tabla de usuarios
    await client.query(`
      CREATE TABLE users (
        user_id VARCHAR(50) PRIMARY KEY,
        documento VARCHAR(50),
        name VARCHAR(200),
        card_no VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Crear tabla de marcaciones con la nueva estructura
    await client.query(`
      CREATE TABLE attendance_logs (
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_time, serial_no)
      );
    `);

    console.log('✅ TABLAS CREADAS EXITOSAMENTE');
  } catch (err) {
    console.error('❌ ERROR AL CREAR TABLAS:', err.message);
  } finally {
    client.release();
    process.exit();
  }
};

initSchema();
