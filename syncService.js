const { pool } = require('./db');

/**
 * Procesa la data recibida vía POST (Modelo PUSH)
 * Realiza el guardado de usuarios (separando documento y nombre)
 * y el guardado de marcaciones.
 */
const processPushData = async (data) => {
    try {
        let users = [];
        let events = [];

        // Detectar si la data es un array directo de eventos o un objeto con keys
        if (Array.isArray(data)) {
            events = data;
            // Si es un array de eventos, intentamos extraer la info de usuarios de los eventos mismos
            // para asegurar que existan en la DB antes de insertar las marcaciones (FK constraint)
            const uniqueUsers = {};
            for (const event of events) {
                const userId = event.employeeNoString || event.employeeNo;
                if (userId && !uniqueUsers[userId]) {
                    uniqueUsers[userId] = {
                        employeeNo: userId,
                        name: event.userName || ''
                    };
                }
            }
            users = Object.values(uniqueUsers);
        } else {
            users = data.users || [];
            events = data.events || [];
        }

        console.log(`\n>>> RECIBIENDO DATA PUSH: ${users.length} usuarios (detectados), ${events.length} eventos.`);

        // 1. Procesar Usuarios (Sincronizar nombres y documentos)
        for (const user of users) {
            const userId = user.employeeNo || user.employeeNoString;
            let rawName = user.name || '';
            let documento = '';
            let name = rawName;

            // Lógica de split para "Documento - Nombre"
            if (rawName.includes(' - ')) {
                const parts = rawName.split(' - ');
                documento = parts[0].trim();
                name = parts.slice(1).join(' - ').trim();
            }

            const cardNo = user.Valid?.cardNo || '';

            await pool.query(`
                INSERT INTO users (user_id, documento, name, card_no)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id) DO UPDATE SET 
                    documento = EXCLUDED.documento,
                    name = EXCLUDED.name, 
                    card_no = EXCLUDED.card_no
            `, [userId, documento, name, cardNo]);
        }

        // 2. Procesar Eventos
        let insertedCount = 0;
        for (const event of events) {
            const userId = event.employeeNoString || event.employeeNo;
            const eventTime = event.time;
            const serialNo = event.serialNo || 0;
            const rawName = event.userName || 'Usuario Desconocido';

            let userName = rawName;
            if (rawName.includes(' - ')) {
                userName = rawName.split(' - ').slice(1).join(' - ').trim();
            }

            if (!userId || !eventTime) continue;

            const query = `
                INSERT INTO attendance_logs (
                    user_id, user_name, event_time, event_type, 
                    major_type, minor_type, card_no, 
                    serial_no, user_type, attendance_status, 
                    raw_data
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (user_id, event_time, serial_no) DO NOTHING
            `;

            const values = [
                userId,
                userName,
                eventTime,
                `${event.major}/${event.minor}`,
                event.major || 0,
                event.minor || 0,
                event.cardNo || '',
                serialNo,
                event.userType || 'normal',
                event.attendanceStatus || 'undefined',
                JSON.stringify(event)
            ];

            const res = await pool.query(query, values);
            if (res.rowCount > 0) insertedCount++;
        }

        console.log(`Push procesado exitosamente. ${insertedCount} nuevas marcaciones.\n`);
        return { success: true, inserted: insertedCount };
    } catch (error) {
        console.error('Error procesando data push:', error.message);
        throw error;
    }
};

module.exports = { processPushData };
