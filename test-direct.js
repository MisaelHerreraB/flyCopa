const axios = require('axios');

async function testDirectOffers() {
    try {
        console.log('🧪 Iniciando prueba del endpoint direct-offers...');
        
        const response = await axios.post('http://localhost:3000/api/direct-offers', {
            transactionidentifier: 'test-' + Date.now(),
            useridentifier: 'test-user-' + Math.random().toString(36).substring(2)
        });
        
        console.log('✅ Respuesta recibida exitosamente');
        console.log('📊 Status:', response.status);
        console.log('📋 Estructura de respuesta:');
        
        const data = response.data;
        
        // Mostrar todas las claves
        console.log('🔑 Todas las claves en la respuesta:');
        Object.keys(data).forEach(key => {
            console.log(`  - ${key}: ${typeof data[key]}`);
        });
        
        // Buscar claves que empiecen con 'direct'
        const directKeys = Object.keys(data).filter(key => key.startsWith('direct'));
        console.log(`\n🎯 Claves que empiezan con 'direct': ${directKeys.length}`);
        directKeys.forEach(key => {
            console.log(`  - ${key}:`, data[key]);
        });
        
        // Mostrar globalCheapest si existe
        if (data.globalCheapest) {
            console.log('\n🏆 GlobalCheapest encontrado:');
            console.log(JSON.stringify(data.globalCheapest, null, 2));
        }
        
        // Mostrar failedApis si existe
        if (data.failedApis) {
            console.log('\n❌ APIs fallidas:');
            console.log(data.failedApis);
        }
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        if (error.response) {
            console.error('📄 Respuesta del servidor:', error.response.data);
        }
    }
}

testDirectOffers();