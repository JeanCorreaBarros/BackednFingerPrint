const axios = require('axios');
require('dotenv').config();

const testPush = async () => {
    const url = `http://localhost:${process.env.PORT || 3000}/api/sync/push`;
    const token = process.env.SYNC_TOKEN;

    const data = {
        users: [
            {
                employeeNo: "999999",
                name: "123456789 - Usuario de Prueba",
                userType: "normal"
            }
        ],
        events: [
            {
                employeeNoString: "999999",
                time: new Date().toISOString(),
                major: 5,
                minor: 38,
                serialNo: 12345,
                attendanceStatus: "check-in"
            }
        ]
    };

    console.log('>>> ENVIANDO DATA DE PRUEBA A:', url);
    try {
        const response = await axios.post(url, data, {
            headers: {
                'x-sync-token': token,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ RESPUESTA DEL SERVIDOR:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ ERROR EN EL TEST:', error.response?.data || error.message);
    }
};

testPush();
