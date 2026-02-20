const { pool } = require('./db');
const { getEvents, getUsers } = require('./hikvisionClient');

const syncUsers = async () => {
    console.log('Sincronizando la lista de usuarios desde el huellero...');
    try {
        const users = await getUsers();
        console.log(`Se encontraron ${users.length} usuarios.`);

        if (users.length > 0) {
            // Log del primer usuario para depuración de campos
            // console.log('Ejemplo de usuario:', JSON.stringify(users[0]));
        }

        for (const user of users) {
            // El campo suele ser employeeNo o userID según el modelo
            const userId = user.employeeNo || user.employeeNoString;
            const name = user.name;
            const cardNo = user.Valid?.cardNo || '';

            const query = `
                INSERT INTO users (user_id, name, card_no)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, card_no = EXCLUDED.card_no
            `;
            await pool.query(query, [userId, name, cardNo]);
        }
    } catch (error) {
        console.error('Error al sincronizar usuarios:', error.message);
    }
};

const syncData = async () => {
    // Primero verificamos conexión
    const isOk = await checkConnection();
    if (!isOk) return;

    console.log('Iniciando sincronización completa (Usuarios y Asistencia)...');
    try {
        // 1. Sincronizar Usuarios primero
        await syncUsers();

        // 2. Sincronizar Eventos de Asistencia
        const events = await getEvents();
        console.log(`Se encontraron ${events.length} eventos en el rango solicitado.`);

        let insertedCount = 0;
        for (const event of events) {
            const userId = event.employeeNoString || event.employeeNo;
            const eventTime = event.time;
            const eventType = event.major || event.minor || 'desconocido';

            if (!userId || !eventTime) continue;

            // Asegurar que el usuario exista
            await pool.query('INSERT INTO users (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);

            const query = `
                INSERT INTO attendance_logs (user_id, event_time, event_type, raw_data)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id, event_time) DO NOTHING
            `;

            const values = [
                userId,
                eventTime,
                String(eventType),
                JSON.stringify(event)
            ];

            const res = await pool.query(query, values);
            if (res.rowCount > 0) insertedCount++;
        }

        console.log(`Sincronización finalizada. Se insertaron ${insertedCount} nuevos registros de asistencia.`);
    } catch (error) {
        console.error('Error durante la sincronización:', error.message);
        throw error;
    }
};

module.exports = { syncData };
