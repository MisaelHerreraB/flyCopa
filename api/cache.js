const { Redis } = require('@upstash/redis');

const redis = new Redis({
    url: process.env.fly_KV_REST_API_URL || "https://charmed-dane-16789.upstash.io",
    token: process.env.fly_KV_REST_API_TOKEN || "AUGVAAIncDI1M2Y5YjIxY2IxYWQ0ZDE5OGY2ZTFjOTU5YWZlZDU1ZnAyMTY3ODk"
});

// Debug: Log de las credenciales (sin mostrar el token completo)
console.log(`[REDIS DEBUG] URL: ${process.env.fly_KV_REST_API_URL || 'not set'}`);
console.log(`[REDIS DEBUG] TOKEN: ${process.env.fly_KV_REST_API_TOKEN ? 'set' : 'not set'}`);

module.exports = async (req, res) => {
    const { action, key, data, ttl, nx, type } = req.body;
    
    // Manejar check-cache como GET request
    if (req.method === 'GET' && req.url.includes('/api/cache')) {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const cacheType = urlParams.searchParams.get('type');
        
        const REDIS_KEYS = {
            'direct': 'mmm-vuelos-2026:direct-flights:combinaciones-completas',
            'offers': 'mmm-vuelos-2026:combinations-summary'
        };
        
        const cacheKey = REDIS_KEYS[cacheType];
        if (!cacheKey) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tipo de cache inválido. Use: direct o offers' 
            });
        }
        
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                let cachedData = cached;
                if (typeof cached === 'string') {
                    try {
                        cachedData = JSON.parse(cached);
                    } catch (e) {
                        cachedData = cached;
                    }
                }
                return res.status(200).json({
                    success: true,
                    data: cachedData,
                    source: 'redis-cache'
                });
            }
            
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
    }
    
    try {
        switch (action) {
            case 'get':
                const cached = await redis.get(key);
                if (cached) {
                    let cachedData = cached;
                    if (typeof cached === 'string') {
                        try {
                            cachedData = JSON.parse(cached);
                        } catch (e) {
                            cachedData = cached;
                        }
                    }
                    return res.status(200).json({ success: true, data: cachedData });
                }
                return res.status(404).json({ success: false, message: 'Key not found' });
                
            case 'set':
                const expiration = ttl || 1800; // 30 minutos por defecto
                
                if (nx) {
                    // SET con NX (solo si no existe)
                    const result = await redis.set(key, JSON.stringify(data), { ex: expiration, nx: true });
                    if (result) {
                        return res.status(200).json({ success: true, message: 'Lock acquired successfully' });
                    } else {
                        return res.status(409).json({ success: false, message: 'Key already exists' });
                    }
                } else {
                    // SET normal
                    await redis.setex(key, expiration, JSON.stringify(data));
                    console.log(`[${new Date().toISOString()}] REDIS SET - ✅ Guardado exitosamente: ${key}`);
                    return res.status(200).json({ success: true, message: 'Data cached successfully' });
                }
                
            case 'del':
                console.log(`[${new Date().toISOString()}] REDIS DEL - Eliminando: ${key}`);
                await redis.del(key);
                console.log(`[${new Date().toISOString()}] REDIS DEL - ✅ Eliminado: ${key}`);
                return res.status(200).json({ success: true, message: 'Key deleted successfully' });
                
            case 'exists':
                console.log(`[${new Date().toISOString()}] REDIS EXISTS - Verificando: ${key}`);
                const exists = await redis.exists(key);
                console.log(`[${new Date().toISOString()}] REDIS EXISTS - ${exists ? '✅' : '❌'} ${key}`);
                return res.status(200).json({ success: true, exists: !!exists });
                
            default:
                return res.status(400).json({ success: false, message: 'Invalid action. Use: get, set, del, exists' });
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] REDIS ERROR:`, error);
        console.error(`[${new Date().toISOString()}] REDIS ERROR Details:`, {
            action,
            key,
            url: process.env.fly_KV_REST_API_URL,
            hasToken: !!process.env.fly_KV_REST_API_TOKEN
        });
        return res.status(500).json({ success: false, error: error.message });
    }
};