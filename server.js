const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON con límite aumentado
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware para agregar headers necesarios
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Simular headers de Vercel para las funciones API
    req.headers['x-forwarded-proto'] = 'http';
    req.headers['x-forwarded-host'] = `localhost:${PORT}`;
    
    next();
});

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Funciones de API adaptadas para Express
const createApiHandler = (handler) => {
    return async (req, res) => {
        try {
            // Simular el contexto de Vercel
            const mockReq = {
                ...req,
                body: req.method === 'GET' ? {} : req.body,
                query: req.query,
                headers: req.headers
            };
            
            const mockRes = {
                status: (code) => {
                    res.status(code);
                    return mockRes;
                },
                json: (data) => {
                    res.json(data);
                },
                send: (data) => {
                    res.send(data);
                }
            };
            
            await handler(mockReq, mockRes);
        } catch (error) {
            console.error('Error en API handler:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
};

// Importar y configurar rutas de API
try {
    const offersHandler = require('./api/offers.js');
    const cacheHandler = require('./api/cache.js');
    const medellinHandler = require('./api/medellin.js');
    const quitoHandler = require('./api/quito.js');
    const caliHandler = require('./api/cali.js');
    const bogotaHandler = require('./api/bogota.js');
    const cartagenaHandler = require('./api/cartagena.js');

    // Configurar rutas
    app.all('/api/offers', createApiHandler(offersHandler));
    app.all('/api/cache', createApiHandler(cacheHandler));
    app.all('/api/medellin', createApiHandler(medellinHandler));
    app.all('/api/quito', createApiHandler(quitoHandler));
    app.all('/api/cali', createApiHandler(caliHandler));
    app.all('/api/bogota', createApiHandler(bogotaHandler));
    app.all('/api/cartagena', createApiHandler(cartagenaHandler));
    
    console.log('✅ Todas las funciones API cargadas correctamente');
} catch (error) {
    console.error('❌ Error cargando funciones API:', error.message);
}

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejar rutas no encontradas
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 FlyCopa - Servidor Local Iniciado`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📁 Archivos estáticos: ${path.join(__dirname, 'public')}`);
    console.log(`\n🔗 APIs Disponibles:`);
    console.log(`   - http://localhost:${PORT}/api/offers`);
    console.log(`   - http://localhost:${PORT}/api/cache`);
    console.log(`   - http://localhost:${PORT}/api/medellin`);
    console.log(`   - http://localhost:${PORT}/api/quito`);
    console.log(`   - http://localhost:${PORT}/api/cali`);
    console.log(`   - http://localhost:${PORT}/api/bogota`);
    console.log(`   - http://localhost:${PORT}/api/cartagena`);
    console.log(`\n🌟 ¡Abre tu navegador y ve a http://localhost:${PORT}!`);
    console.log(`\n💡 Para detener el servidor: Ctrl + C`);
});

module.exports = app;