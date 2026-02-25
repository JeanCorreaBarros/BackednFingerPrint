-- PASO 1: Asegúrate de estar dentro de la base de datos 'fingerprint_db' en pgAdmin.
-- Si la base de datos no existe, créala primero (Click derecho en 'Databases' -> 'Create' -> 'Database').

-- PASO 2: Ejecuta este código para crear o limpiar las tablas
DROP TABLE IF EXISTS attendance_logs;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    documento VARCHAR(50),
    name VARCHAR(200),
    card_no VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    device_id INTEGER,
    device_name VARCHAR(200),
    sede_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_time, serial_no)
);
