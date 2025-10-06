const axios = require('axios');

// Función para llamar al sistema de cache con URL base dinámica
function createCacheFunction(req) {
    return async function callCache(action, key, data = null, ttl = 1800, nx = false) {
        try {
            const BASE_URL = req.headers['x-forwarded-proto'] && req.headers['x-forwarded-host'] 
                ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`
                : 'http://localhost:3000';
            
            const payload = { action, key, data, ttl, nx };
            const response = await axios.post(`${BASE_URL}/api/cache`, payload);
            return response.data;
        } catch (error) {
            console.error(`[CACHE ${action.toUpperCase()}] Error:`, error.message);
            return { success: false, error: error.message };
        }
    };
}

module.exports = async (req, res) => {
    const { 
        transactionidentifier, 
        useridentifier,
        returnDate = '2026-02-18'     // Fecha de regreso
    } = req.body;
    
    if (!transactionidentifier || !useridentifier) {
        return res.status(400).json({ error: 'transactionidentifier y useridentifier son requeridos' });
    }

    // Crear función de cache específica para este request
    const callCache = createCacheFunction(req);
    
    // Crear clave de cache única para esta combinación de fechas
    const departureDate = '2026-02-12';

    // Crear clave de cache única para esta combinación de fechas
    const cacheKey = `direct_flights_${departureDate}_${transactionidentifier}`;
    const lockKey = `lock_${cacheKey}`;
    
    try {
        // Verificar si ya existe en cache
        console.log(`[DIRECT ${departureDate}] Verificando cache: ${cacheKey}`);
        const cachedResult = await callCache('get', cacheKey);
        
        if (cachedResult.success && cachedResult.data) {
            console.log(`[DIRECT ${departureDate}] ✅ Cache hit: ${cacheKey}`);
            return res.json({
                ...cachedResult.data,
                cached: true,
                cacheKey: cacheKey
            });
        }
        
        console.log(`[DIRECT ${departureDate}] ❌ Cache miss: ${cacheKey}`);
        
        // Implementar bloqueo para evitar múltiples llamadas simultáneas
        const lockResult = await callCache('set', lockKey, { locked: true }, 60, true); // Lock por 60 segundos
        
        if (!lockResult.success) {
            console.log(`[DIRECT ${departureDate}] 🔒 Otra consulta en progreso, esperando cache...`);
            // Esperar un poco y verificar cache otra vez
            await new Promise(resolve => setTimeout(resolve, 2000));
            const waitResult = await callCache('get', cacheKey);
            if (waitResult.success && waitResult.data) {
                return res.json({
                    ...waitResult.data,
                    cached: true,
                    cacheKey: cacheKey,
                    waited: true
                });
            }
        }

        const headers = {
            'accept': '*/*',
            'accept-language': 'es-PA',
            'origin': 'https://shopping.copaair.com',
            'priority': 'u=1, i',
            'rulecode': 'zGkNh9K3h2UI75E+7tIfBAcnKyOGvwFLCwFmANeXphM=',
            'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'storefront': 'GS',
            'transactionidentifier': transactionidentifier,
            'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
            'useridentifier': useridentifier,
            'Cookie': 'incap_ses_1720_2819721=RB/wMWWejT7gJgr2S6veF8JL42gAAAAAoJFurUVn+7xZ8ZoqWaZVSw==; nlbi_2819721=H9NLH+ChWxoWSGNWKqYZMAAAAADVIdD/5dKNzXrc6DerQYOY; visid_incap_2819721=udcRzSPmS7uAN0+0ZaK+JMJL42gAAAAAQUIPAAAAAAAQxsF25xZCsdhvOTy205mT'
        };        const results = {};
        
        // Array de fechas de regreso para iterar (18, 19, 20 feb)
        const returnDates = ['2026-02-18', '2026-02-19', '2026-02-20'];
        
        for (const retDate of returnDates) {
            const url = `https://api.copaair.com/ibe/booking/plan?departureAirport1=LIM&arrivalAirport1=PTY&departureDate1=${departureDate}&adults=1&children=0&infants=0&isRoundTrip=true&departureAirport2=PTY&arrivalAirport2=LIM&departureDate2=${retDate}&promoCode=B9580&isConventionCode=true`;
            
            const apiName = `DIRECT_${departureDate}_TO_${retDate}`;
            
            try {
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: url,
            headers: headers
        };
        
        const response = await axios.request(config);                const data = response.data;
                
                if (data && !data.error) {
                    // Procesar datos para extraer información relevante
                    let processedData = {
                        departureDate: departureDate,
                        returnDate: retDate,
                        outbound: null,
                        return: null,
                        totalPrice: 0,
                        currency: 'USD'
                    };
                    
                    if (Array.isArray(data) && data.length >= 2) {
                        const outboundFlight = data[0];
                        const returnFlight = data[1];
                        
                        // Procesar vuelo de ida
                        if (outboundFlight.solutions && outboundFlight.solutions.length > 0) {
                            const cheapestOut = outboundFlight.solutions.reduce((min, solution) => {
                                return solution.lowestPriceCoachCabin < min.lowestPriceCoachCabin ? solution : min;
                            });
                            
                            processedData.outbound = {
                                price: cheapestOut.lowestPriceCoachCabin,
                                journeyTime: cheapestOut.journeyTime,
                                numberOfLayovers: cheapestOut.numberOfLayovers,
                                flights: cheapestOut.flights
                            };
                        }
                        
                        // Procesar vuelo de regreso
                        if (returnFlight.solutions && returnFlight.solutions.length > 0) {
                            const cheapestRet = returnFlight.solutions.reduce((min, solution) => {
                                return solution.lowestPriceCoachCabin < min.lowestPriceCoachCabin ? solution : min;
                            });
                            
                            processedData.return = {
                                price: cheapestRet.lowestPriceCoachCabin,
                                journeyTime: cheapestRet.journeyTime,
                                numberOfLayovers: cheapestRet.numberOfLayovers,
                                flights: cheapestRet.flights
                            };
                        }
                        
                        // Calcular precio total
                        processedData.totalPrice = (processedData.outbound?.price || 0) + (processedData.return?.price || 0);
                    }
                    
                    results[retDate] = processedData;
                } else {
                    results[retDate] = { 
                        error: data?.error || 'Error desconocido',
                        departureDate: departureDate,
                        returnDate: retDate
                    };
                }
            } catch (error) {
                console.error(`Error en ${apiName}:`, error);
                results[retDate] = { 
                    error: `Error al conectar con la API: ${error.message}`,
                    departureDate: departureDate,
                    returnDate: retDate
                };
            }
        }
        
        // Encontrar la combinación más barata
        let cheapestCombination = null;
        let cheapestPrice = Infinity;
        
        Object.values(results).forEach(result => {
            if (result.totalPrice && result.totalPrice > 0 && result.totalPrice < cheapestPrice) {
                cheapestPrice = result.totalPrice;
                cheapestCombination = result;
            }
        });
        
        // Preparar resultado final
        const finalResult = {
            success: true,
            departureDate: departureDate,
            results: results,
            cheapest: cheapestCombination,
            summary: {
                totalCombinations: Object.keys(results).length,
                successfulCombinations: Object.values(results).filter(r => !r.error).length,
                cheapestPrice: cheapestPrice !== Infinity ? cheapestPrice : null
            }
        };
        
        // Guardar resultado en cache (TTL: 30 minutos = 1800 segundos)
        await callCache('set', cacheKey, finalResult, 1800);
        console.log(`[DIRECT ${departureDate}] ✅ Resultado guardado en cache: ${cacheKey}`);
        
        // Liberar lock
        await callCache('del', lockKey);
        
        res.json({
            ...finalResult,
            cached: false,
            cacheKey: cacheKey
        });
        
    } catch (error) {
        console.error('Error general en directo-12feb:', error);
        
        // Liberar lock en caso de error
        try {
            await callCache('del', lockKey);
        } catch (unlockError) {
            console.error('Error liberando lock:', unlockError);
        }
        
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
};