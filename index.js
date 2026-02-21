const express = require('express');
const { initDb } = require('./db');
const { processPushData } = require('./syncService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Inicializar base de datos
initDb();

// --- SEGURIDAD ---
const validateToken = (req, res, next) => {
    const token = req.headers['x-sync-token'];
    if (!token || token !== process.env.SYNC_TOKEN) {
        return res.status(401).json({ error: 'No autorizado. Token inválido o ausente.' });
    }
    next();
};

// --- ENDPOINTS DE SINCRONIZACIÓN ---

/**
 * Endpoint PUSH: Recibe la data del huellero vía POST.
 * Requiere el token configurado en .env
 */
app.post('/api/sync/push', validateToken, async (req, res) => {
    try {
        const result = await processPushData(req.body);
        res.status(200).json(result);
    } catch (error) {
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

// Actualizar nombre, tarjeta o documento de un usuario
app.put('/api/users/:id', async (req, res) => {
    const { pool } = require('./db');
    const { name, card_no, documento } = req.body;
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, card_no = $2, documento = $3 WHERE user_id = $4 RETURNING *',
            [name, card_no, documento, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar un usuario de la base de datos
app.delete('/api/users/:id', async (req, res) => {
    const { pool } = require('./db');
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
        res.json({ message: 'Usuario eliminado' });
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
        SELECT l.*, u.documento 
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
                u.documento,
                u.name, 
                COUNT(l.id) as total_marcaciones,
                MIN(l.event_time) as primera_marcacion,
                MAX(l.event_time) as ultima_marcacion
            FROM users u
            LEFT JOIN attendance_logs l ON u.user_id = l.user_id
            GROUP BY u.user_id, u.documento, u.name
            ORDER BY total_marcaciones DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`Backend Cloud listo en puerto ${PORT}`);
    console.log(`Endpoint Push: http://localhost:${PORT}/api/sync/push`);
    console.log(`==================================================\n`);
});
