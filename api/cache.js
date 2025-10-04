const { Redis } = require('@upstash/redis');

const redis = new Redis({
    url: process.env.fly_KV_REST_API_URL || "https://charmed-dane-16789.upstash.io",
    token: process.env.fly_KV_REST_API_TOKEN || "AUGVAAIncDI1M2Y5YjIxY2IxYWQ0ZDE5OGY2ZTFjOTU5YWZlZDU1ZnAyMTY3ODk"
});

module.exports = async (req, res) => {
    const { action, key, data, ttl } = req.body;
    
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
                await redis.setex(key, expiration, JSON.stringify(data));
                return res.status(200).json({ success: true, message: 'Data cached successfully' });
                
            case 'del':
                await redis.del(key);
                return res.status(200).json({ success: true, message: 'Key deleted successfully' });
                
            case 'exists':
                const exists = await redis.exists(key);
                return res.status(200).json({ success: true, exists: !!exists });
                
            default:
                return res.status(400).json({ success: false, message: 'Invalid action. Use: get, set, del, exists' });
        }
    } catch (error) {
        console.error('Redis operation error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};