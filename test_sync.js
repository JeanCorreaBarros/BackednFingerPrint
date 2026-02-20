const { syncData } = require('./syncService');

async function test() {
    try {
        await syncData();
        console.log('✅ TEST DE SINCRONIZACIÓN COMPLETADO.');
        process.exit(0);
    } catch (err) {
        console.error('❌ ERROR EN TEST:', err);
        process.exit(1);
    }
}

test();
