const { pool } = require('./db');
const { getEvents, getUsers, checkConnection } = require('./hikvisionClient');

const syncUsers = async () => {
    console.log('Sincronizando la lista de usuarios desde el huellero...');
    try {
        const users = await getUsers();
        console.log(`Se encontraron ${users.length} usuarios.`);

        if (users.length > 0) {
            console.log('>>> DATA CRUDA DE USUARIOS RECIBIDA:', JSON.stringify(users, null, 2));
        }

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

            const query = `
                INSERT INTO users (user_id, documento, name, card_no)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id) DO UPDATE SET 
                    documento = EXCLUDED.documento,
                    name = EXCLUDED.name, 
                    card_no = EXCLUDED.card_no
            `;
            await pool.query(query, [userId, documento, name, cardNo]);
        }
        return users;
    } catch (error) {
        console.error('Error al sincronizar usuarios:', error.message);
        return [];
    }
};

const syncData = async () => {
    const isOk = await checkConnection();
    if (!isOk) return;

    console.log('Iniciando sincronización completa (Usuarios y Asistencia)...');
    try {
        // 1. Obtener Usuarios
        const users = await syncUsers();

        // 2. Obtener Eventos
        const events = await getEvents();
        console.log(`Se encontraron ${events.length} eventos en total.`);

        if (events.length > 0) {
            console.log('>>> DATA CRUDA DE EVENTOS RECIBIDA:', JSON.stringify(events, null, 2));
        }

        // 3. Procesar y guardar eventos
        // Crear un mapa de ID -> Nombre para guardar en los logs directamente
        const nameMap = {};
        users.forEach(u => {
            nameMap[u.employeeNo || u.employeeNoString] = u.name;
        });

        let insertedCount = 0;
        for (const event of events) {
            const userId = event.employeeNoString || event.employeeNo;
            const eventTime = event.time;
            const serialNo = event.serialNo || 0;
            const userName = nameMap[userId] || 'Usuario Desconocido';

            if (!userId || !eventTime) continue;

            // Asegurar que el usuario exista
            await pool.query('INSERT INTO users (user_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, userName]);

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

        // 4. Crear el JSON combinado que pidió el usuario para la consola
        const combined = users.map(u => {
            const uId = u.employeeNo || u.employeeNoString;
            return {
                ...u,
                marcaciones: events.filter(e => (e.employeeNoString || e.employeeNo) === uId)
            };
        });

        console.log('\n==================================================');
        console.log('           RESUMEN COMBINADO (USUARIOS + HUELLAS)');
        console.log('==================================================');
        console.log(JSON.stringify(combined, null, 2));
        console.log('==================================================\n');

        console.log(`Sincronización finalizada. Se insertaron ${insertedCount} nuevos registros.`);
    } catch (error) {
        console.error('Error durante la sincronización:', error.message);
        throw error;
    }
};

module.exports = { syncData };
