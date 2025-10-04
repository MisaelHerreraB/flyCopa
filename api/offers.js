const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
    const BASE_URL = req.headers['x-forwarded-proto'] && req.headers['x-forwarded-host'] 
        ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`
        : 'http://localhost:3000';
    
    try {
        // Generar identificadores para las APIs de Copa
        const now = new Date();
        const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-${String(now.getUTCDate()).padStart(2,'0')}-` + (now.getUTCHours()<12 ? 'AM' : 'PM');
        
        // Verificar cache de identificadores
        const cacheResponse = await axios.post(`${BASE_URL}/api/cache`, {
            action: 'get',
            key: `copaair:identifiers:${period}`
        }).catch(() => null);
        
        let transactionidentifier, useridentifier;
        
        if (cacheResponse && cacheResponse.data.success) {
            const identifiers = cacheResponse.data.data;
            transactionidentifier = identifiers.transactionidentifier;
            useridentifier = identifiers.useridentifier;
        } else {
            // Generar nuevos identificadores
            transactionidentifier = uuidv4();
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            useridentifier = Array.from({length: 21}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            
            // Guardar en cache por 6 horas
            await axios.post(`${BASE_URL}/api/cache`, {
                action: 'set',
                key: `copaair:identifiers:${period}`,
                data: { transactionidentifier, useridentifier },
                ttl: 60 * 60 * 6
            }).catch(console.error);
        }
        
        // Verificar cache principal de ofertas
        const REDIS_KEY = "copaair:offers:2026-02-13";
        const cachedOffers = await axios.post(`${BASE_URL}/api/cache`, {
            action: 'get',
            key: REDIS_KEY
        }).catch(() => null);
        
        // Verificar si hay APIs fallidas que no debemos reintentar aún
        const FAILED_KEY = "copaair:failed:2026-02-13";
        const FAILED_TIMESTAMP_KEY = "copaair:failed:timestamp:2026-02-13";
        const MIN_RETRY_INTERVAL = 5 * 60 * 1000; // 5 minutos
        
        let shouldSkipFailedApis = true;
        const failedResponse = await axios.post(`${BASE_URL}/api/cache`, {
            action: 'get',
            key: FAILED_KEY
        }).catch(() => null);
        
        const failedTimestampResponse = await axios.post(`${BASE_URL}/api/cache`, {
            action: 'get',
            key: FAILED_TIMESTAMP_KEY
        }).catch(() => null);
        
        if (failedResponse && failedResponse.data.success && failedTimestampResponse && failedTimestampResponse.data.success) {
            const lastFailureTime = parseInt(failedTimestampResponse.data.data);
            const timeSinceFailure = Date.now() - lastFailureTime;
            
            if (timeSinceFailure >= MIN_RETRY_INTERVAL) {
                shouldSkipFailedApis = false;
                console.log(`[${new Date().toISOString()}] Reintento automático activado para APIs fallidas`);
            }
        }
        
        // Si tenemos cache y no es momento de reintentar APIs fallidas, retornar cache
        if (cachedOffers && cachedOffers.data.success && shouldSkipFailedApis) {
            console.log(`[${new Date().toISOString()}] Retornando datos desde cache`);
            return res.status(200).json(cachedOffers.data.data);
        }
        
        console.log(`[${new Date().toISOString()}] Iniciando llamadas concurrentes a APIs especializadas`);
        
        // Llamadas concurrentes a todas las funciones especializadas
        const cityPromises = [
            axios.post(`${BASE_URL}/api/medellin`, { 
                transactionidentifier, 
                useridentifier,
                stopover: 'both'
            }).catch(err => ({ error: true, city: 'Medellín', message: err.message })),
            
            axios.post(`${BASE_URL}/api/quito`, { 
                transactionidentifier, 
                useridentifier,
                stopover: 'both'
            }).catch(err => ({ error: true, city: 'Quito', message: err.message })),
            
            axios.post(`${BASE_URL}/api/cali`, { 
                transactionidentifier, 
                useridentifier,
                stopover: 'both'
            }).catch(err => ({ error: true, city: 'Cali', message: err.message })),
            
            axios.post(`${BASE_URL}/api/bogota`, { 
                transactionidentifier, 
                useridentifier,
                stopover: 'both'
            }).catch(err => ({ error: true, city: 'Bogotá', message: err.message })),
            
            axios.post(`${BASE_URL}/api/cartagena`, { 
                transactionidentifier, 
                useridentifier,
                stopover: 'both'
            }).catch(err => ({ error: true, city: 'Cartagena', message: err.message }))
        ];
        
        const startTime = Date.now();
        const cityResults = await Promise.allSettled(cityPromises);
        const duration = Date.now() - startTime;
        
        console.log(`[${new Date().toISOString()}] Llamadas concurrentes completadas en ${duration}ms`);
        
        // Procesar resultados y mapear a estructura original
        const response = {
            itinerary1: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> PTY -> MDE -> LIM', city: 'Medellín', stopover: 'ida' },
            itinerary2: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> PTY -> UIO -> LIM', city: 'Quito', stopover: 'ida' },
            itinerary3: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> PTY -> CLO -> LIM', city: 'Cali', stopover: 'ida' },
            itinerary4: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> PTY -> BOG -> LIM', city: 'Bogotá', stopover: 'ida' },
            itinerary5: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> PTY -> CTG -> LIM', city: 'Cartagena', stopover: 'ida' },
            itinerary6: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> MDE -> PTY -> LIM', city: 'Medellín', stopover: 'regreso' },
            itinerary7: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> UIO -> PTY -> LIM', city: 'Quito', stopover: 'regreso' },
            itinerary8: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> CLO -> PTY -> LIM', city: 'Cali', stopover: 'regreso' },
            itinerary9: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> BOG -> PTY -> LIM', city: 'Bogotá', stopover: 'regreso' },
            itinerary10: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> CTG -> PTY -> LIM', city: 'Cartagena', stopover: 'regreso' },
            globalCheapest: null
        };
        
        const cityMapping = [
            { city: 'Medellín', idaItinerary: 'itinerary1', regresoItinerary: 'itinerary6' },
            { city: 'Quito', idaItinerary: 'itinerary2', regresoItinerary: 'itinerary7' },
            { city: 'Cali', idaItinerary: 'itinerary3', regresoItinerary: 'itinerary8' },
            { city: 'Bogotá', idaItinerary: 'itinerary4', regresoItinerary: 'itinerary9' },
            { city: 'Cartagena', idaItinerary: 'itinerary5', regresoItinerary: 'itinerary10' }
        ];
        
        const failedApis = [];
        
        // Procesar cada resultado de ciudad
        cityResults.forEach((result, index) => {
            const cityInfo = cityMapping[index];
            
            if (result.status === 'fulfilled' && result.value && !result.value.error) {
                const cityData = result.value.data;
                
                // Procesar ida
                if (cityData.data && cityData.data.ida && !cityData.data.ida.error) {
                    response[cityInfo.idaItinerary] = processOffers(cityData.data.ida, response[cityInfo.idaItinerary]);
                } else {
                    response[cityInfo.idaItinerary].error = cityData.data?.ida?.error || 'Error en stopover de ida';
                    failedApis.push(`${cityInfo.city}-ida`);
                }
                
                // Procesar regreso
                if (cityData.data && cityData.data.regreso && !cityData.data.regreso.error) {
                    response[cityInfo.regresoItinerary] = processOffers(cityData.data.regreso, response[cityInfo.regresoItinerary]);
                } else {
                    response[cityInfo.regresoItinerary].error = cityData.data?.regreso?.error || 'Error en stopover de regreso';
                    failedApis.push(`${cityInfo.city}-regreso`);
                }
            } else {
                response[cityInfo.idaItinerary].error = result.value?.message || 'Error en función de ciudad';
                response[cityInfo.regresoItinerary].error = result.value?.message || 'Error en función de ciudad';
                failedApis.push(`${cityInfo.city}-ida`, `${cityInfo.city}-regreso`);
            }
        });
        
        // Calcular globalCheapest
        const allCheapest = Object.values(response)
            .filter(itinerary => itinerary.cheapest && typeof itinerary.cheapest.price === 'number')
            .map(itinerary => ({
                price: itinerary.cheapest.price,
                itinerary: itinerary.itinerary,
                city: itinerary.city,
                stopover: itinerary.stopover,
                offerIds: itinerary.cheapest.offerIds
            }))
            .sort((a, b) => a.price - b.price);
        
        response.globalCheapest = allCheapest.length > 0 ? allCheapest[0] : null;
        
        // Guardar en cache por 30 minutos
        await axios.post(`${BASE_URL}/api/cache`, {
            action: 'set',
            key: REDIS_KEY,
            data: response,
            ttl: 1800 // 30 minutos
        }).catch(console.error);
        
        // Actualizar APIs fallidas si las hay
        if (failedApis.length > 0) {
            await axios.post(`${BASE_URL}/api/cache`, {
                action: 'set',
                key: FAILED_KEY,
                data: failedApis,
                ttl: 600 // 10 minutos
            }).catch(console.error);
            
            await axios.post(`${BASE_URL}/api/cache`, {
                action: 'set',
                key: FAILED_TIMESTAMP_KEY,
                data: Date.now(),
                ttl: 600 // 10 minutos
            }).catch(console.error);
        } else {
            // Limpiar APIs fallidas si todo fue exitoso
            await axios.post(`${BASE_URL}/api/cache`, {
                action: 'del',
                key: FAILED_KEY
            }).catch(console.error);
            
            await axios.post(`${BASE_URL}/api/cache`, {
                action: 'del',
                key: FAILED_TIMESTAMP_KEY
            }).catch(console.error);
        }
        
        console.log(`[${new Date().toISOString()}] Respuesta procesada exitosamente. APIs fallidas: ${failedApis.length}`);
        
        return res.status(200).json(response);
        
    } catch (error) {
        console.error('Error en función principal:', error);
        return res.status(500).json({ 
            error: 'Error interno del servidor',
            message: error.message 
        });
    }
};

// Función auxiliar para procesar ofertas (debe ser implementada)
function processOffers(apiData, itineraryObj) {
    if (!apiData || !apiData.offers) {
        return { ...itineraryObj, error: 'No se encontraron ofertas' };
    }
    
    const offers = apiData.offers.map(offer => ({
        id: offer.id,
        price: offer.pricePerAdult?.toString() || '0',
        duration: offer.totalDuration || '0',
        stops: offer.connections || 0,
        segments: offer.segments || []
    }));
    
    const cheapest = offers.length > 0 
        ? offers.reduce((min, offer) => 
            parseFloat(offer.price) < parseFloat(min.price) ? offer : min
          )
        : null;
    
    return {
        ...itineraryObj,
        offers,
        cheapest: cheapest ? {
            price: cheapest.price,
            duration: cheapest.duration,
            stops: cheapest.stops,
            offerIds: [cheapest.id]
        } : null,
        error: null
    };
}