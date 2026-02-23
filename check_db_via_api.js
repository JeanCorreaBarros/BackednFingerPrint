const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function checkDatabase() {
    try {
        console.log('--- VERIFICANDO USUARIOS ---');
        const usersRes = await axios.get(`${BASE_URL}/users`);
        console.log(`Total usuarios: ${usersRes.data.length}`);
        console.log(JSON.stringify(usersRes.data, null, 2));

        console.log('\n--- VERIFICANDO ASISTENCIA ---');
        const attendanceRes = await axios.get(`${BASE_URL}/attendance`);
        console.log(`Total marcaciones: ${attendanceRes.data.length}`);
        // Mostrar los últimos 5
        console.log(JSON.stringify(attendanceRes.data.slice(0, 5), null, 2));
    } catch (error) {
        console.error('Error verificando:', error.message);
    }
}

checkDatabase();
