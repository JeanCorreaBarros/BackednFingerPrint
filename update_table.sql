-- Agregar nuevos campos a la tabla attendance_logs
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS device_id INTEGER;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS device_name VARCHAR(200);
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS sede_id VARCHAR(50);
