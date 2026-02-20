const express = require('express');
const cron = require('node-cron');
const { initDb } = require('./db');
const { syncData } = require('./syncService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Inicializar base de datos
initDb();

// --- ENDPOINTS DE SINCRONIZACIÓN ---

// Disparar sincronización manualmente (funciona con GET desde el navegador)
app.get('/api/sync', async (req, res) => {
    try {
        await syncData();
        res.status(200).json({ message: 'Sync triggered successfully' });
    } catch (error) {
        const fs = require('fs');
        fs.appendFileSync('error.log', `${new Date().toISOString()} - ${error.stack}\n`);
        res.status(500).json({ error: error.message });
    }
});

// --- CRUD DE USUARIOS ---

// Listar todos los usuarios
app.get('/api/users', async (req, res) => {
    const { pool } = require('./db');
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar nombre o tarjeta de un usuario
app.put('/api/users/:id', async (req, res) => {
    const { pool } = require('./db');
    const { name, card_no } = req.body;
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, card_no = $2 WHERE user_id = $3 RETURNING *',
            [name, card_no, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar un usuario de la base de datosLocal
app.delete('/api/users/:id', async (req, res) => {
    const { pool } = require('./db');
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
        res.json({ message: 'Usuario eliminado de la base de datos' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CONSULTA DE ASISTENCIA ---

// Ver registros con filtros (fecha y usuario)
app.get('/api/attendance', async (req, res) => {
    const { pool } = require('./db');
    const { start, end, user_id } = req.query;

    let query = `
        SELECT l.*, u.name 
        FROM attendance_logs l 
        LEFT JOIN users u ON l.user_id = u.user_id 
        WHERE 1=1
    `;
    const params = [];

    if (start) {
        params.push(start);
        query += ` AND l.event_time >= $${params.length}`;
    }
    if (end) {
        params.push(end);
        query += ` AND l.event_time <= $${params.length}`;
    }
    if (user_id) {
        params.push(user_id);
        query += ` AND l.user_id = $${params.length}`;
    }

    query += ' ORDER BY l.event_time DESC';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Resumen de asistencia por usuario (Conteo y Horarios)
app.get('/api/attendance/summary', async (req, res) => {
    const { pool } = require('./db');
    try {
        const query = `
            SELECT 
                u.user_id, 
                u.name, 
                COUNT(l.id) as total_marcaciones,
                MIN(l.event_time) as primera_marcacion,
                MAX(l.event_time) as ultima_marcacion
            FROM users u
            LEFT JOIN attendance_logs l ON u.user_id = l.user_id
            GROUP BY u.user_id, u.name
            ORDER BY total_marcaciones DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- SEGURIDAD Y TAREAS ---

// Programar tarea automática (cada 5 min)
cron.schedule(process.env.SYNC_INTERVAL || '*/5 * * * *', () => {
    console.log('Ejecutando sincronización programada...');
    syncData().catch(err => console.error('Error en cron sync:', err.message));
});

app.listen(PORT, () => {
    console.log(`Servidor CRUD listo en puerto ${PORT}`);
});
