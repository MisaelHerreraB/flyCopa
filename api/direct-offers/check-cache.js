const axios = require('axios');

const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
const REDIS_KEY = 'mmm-vuelos-2026:direct-flights:combinaciones-completas';

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' });
    }
    
    try {
        console.log(`[${new Date().toISOString()}] CHECK-CACHE: Verificando cache de vuelos directos...`);
        
        // Verificar cache principal de vuelos directos
        const cachedFlights = await axios.post(`${BASE_URL}/api/cache`, {
            action: 'get',
            key: REDIS_KEY
        }).catch(() => null);
        
        if (cachedFlights && cachedFlights.data.success && cachedFlights.data.data) {
            console.log(`[${new Date().toISOString()}] CHECK-CACHE: Datos encontrados en cache`);
            return res.status(200).json({
                success: true,
                data: cachedFlights.data.data,
                source: 'redis-cache'
            });
        }
        
        console.log(`[${new Date().toISOString()}] CHECK-CACHE: No hay datos en cache`);
        return res.status(200).json({
            success: false,
            data: null,
            source: 'no-cache'
        });
        
    } catch (error) {
        console.error('Error verificando cache:', error);
        return res.status(500).json({
            success: false,
            error: 'Error verificando cache de Redis',
            details: error.message
        });
    }
};