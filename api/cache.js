const { Redis } = require('@upstash/redis');

const redis = new Redis({
    url: process.env.fly_KV_REST_API_URL || "https://charmed-dane-16789.upstash.io",
    token: process.env.fly_KV_REST_API_TOKEN || "AUGVAAIncDI1M2Y5YjIxY2IxYWQ0ZDE5OGY2ZTFjOTU5YWZlZDU1ZnAyMTY3ODk"
});

// Debug: Log de las credenciales (sin mostrar el token completo)
console.log(`[REDIS DEBUG] URL: ${process.env.fly_KV_REST_API_URL || 'not set'}`);
console.log(`[REDIS DEBUG] TOKEN: ${process.env.fly_KV_REST_API_TOKEN ? 'set' : 'not set'}`);

module.exports = async (req, res) => {
    const { action, key, data, ttl, nx } = req.body;
    
    console.log(`[${new Date().toISOString()}] REDIS ${action.toUpperCase()} - Key: ${key}`);
    
    try {
        switch (action) {
            case 'get':
                console.log(`[${new Date().toISOString()}] REDIS GET - Buscando clave: ${key}`);
                const cached = await redis.get(key);
                if (cached) {
                    console.log(`[${new Date().toISOString()}] REDIS GET - ✅ Encontrado: ${key}`);
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
                console.log(`[${new Date().toISOString()}] REDIS GET - ❌ No encontrado: ${key}`);
                return res.status(404).json({ success: false, message: 'Key not found' });
                
            case 'set':
                console.log(`[${new Date().toISOString()}] REDIS SET - Guardando: ${key}, TTL: ${ttl || 1800}s, NX: ${!!nx}`);
                const expiration = ttl || 1800; // 30 minutos por defecto
                
                if (nx) {
                    // SET con NX (solo si no existe)
                    const result = await redis.set(key, JSON.stringify(data), { ex: expiration, nx: true });
                    if (result) {
                        console.log(`[${new Date().toISOString()}] REDIS SET NX - ✅ Lock adquirido: ${key}`);
                        return res.status(200).json({ success: true, message: 'Lock acquired successfully' });
                    } else {
                        console.log(`[${new Date().toISOString()}] REDIS SET NX - ❌ Lock no adquirido (key existe): ${key}`);
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