const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Función para generar segmentos reales basados en ofertas de vuelos directos
function generateDirectSegments(globalCheapest, allFlights) {
    if (!globalCheapest || !globalCheapest.data) {
        return null;
    }
    
    const data = globalCheapest.data;
    const segments = [];
    
    // Procesar vuelo de ida
    if (data.outbound && data.outbound.flights) {
        data.outbound.flights.forEach((flight) => {
            segments.push({
                date: data.departureDate,
                from: 'LIM',
                departure: flight.departure?.flightTime || 'N/A',
                to: 'PTY',
                arrival: flight.arrival?.flightTime || 'N/A',
                class: 'Económica Basic',
                direct: data.outbound.numberOfLayovers === 0,
                stops: data.outbound.numberOfLayovers > 0 ? `${data.outbound.numberOfLayovers} escala(s)` : 'Sin escalas',
                flightNumber: flight.marketingCarrier?.flightNumber || 'CP XXX',
                aircraft: flight.aircraftName || 'Boeing 737-800'
            });
        });
    }
    
    // Procesar vuelo de regreso
    if (data.return && data.return.flights) {
        data.return.flights.forEach((flight) => {
            segments.push({
                date: data.returnDate,
                from: 'PTY',
                departure: flight.departure?.flightTime || 'N/A',
                to: 'LIM',
                arrival: flight.arrival?.flightTime || 'N/A',
                class: 'Económica Basic',
                direct: data.return.numberOfLayovers === 0,
                stops: data.return.numberOfLayovers > 0 ? `${data.return.numberOfLayovers} escala(s)` : 'Sin escalas',
                flightNumber: flight.marketingCarrier?.flightNumber || 'CP XXX',
                aircraft: flight.aircraftName || 'Boeing 737-800'
            });
        });
    }
    
    return segments.length > 0 ? segments : null;
}

// Función para generar estructura base de vuelos directos
function generateDirectFlightConfig() {
    const directFlights = {};
    const departDates = ['2026-02-10', '2026-02-11', '2026-02-12', '2026-02-13'];
    const returnDates = ['2026-02-18', '2026-02-19', '2026-02-20'];
    
    let counter = 1;
    
    departDates.forEach(departDate => {
        returnDates.forEach(returnDate => {
            const key = `direct${counter.toString().padStart(2, '0')}`;
            directFlights[key] = {
                itinerary: counter,
                route: 'LIM ⇄ PTY',
                type: 'Vuelo Directo',
                departureDate: departDate,
                returnDate: returnDate,
                searchDate: departDate, // Para compatibilidad
                city: 'Panamá',
                stopover: 'directo',
                offers: [],
                cheapest: null,
                error: null
            };
            counter++;
        });
    });
    
    return directFlights;
}

module.exports = async (req, res) => {
    const BASE_URL = req.headers['x-forwarded-proto'] && req.headers['x-forwarded-host'] 
        ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`
        : 'http://localhost:3000';
    
    // Definir claves de Redis para vuelos directos
    const REDIS_KEY = `mmm-vuelos-2026:direct-flights:combinaciones-completas`;
    const PROCESSING_KEY = `mmm-vuelos-2026:procesando:direct-flights-activas`;
    const FAILED_KEY = `mmm-vuelos-2026:fallidas:direct-flights-error`;
    const FAILED_TIMESTAMP_KEY = `mmm-vuelos-2026:timestamp:direct-ultimo-error`;
    
    try {
        // Generar identificadores para las APIs de Copa
        const now = new Date();
        const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-${String(now.getUTCDate()).padStart(2,'0')}-` + (now.getUTCHours()<12 ? 'AM' : 'PM');
        
        // Verificar cache de identificadores (usando la misma clave que stopover)
        const cacheResponse = await axios.post(`${BASE_URL}/api/cache`, {
            action: 'get',
            key: `flycopaapp:identifiers:${period}`
        }).catch(() => null);
        
        let transactionidentifier, useridentifier;
        
        if (cacheResponse && cacheResponse.data.success) {
            const identifiers = cacheResponse.data.data;
            transactionidentifier = identifiers.transactionidentifier;
            useridentifier = identifiers.useridentifier;
        } else {
            // Generar nuevos identificadores (exactamente igual que stopover)
            transactionidentifier = uuidv4();
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            useridentifier = Array.from({length: 21}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            
            // Guardar en cache por 6 horas (usando la misma clave que stopover)
            await axios.post(`${BASE_URL}/api/cache`, {
                action: 'set',
                key: `flycopaapp:identifiers:${period}`,
                data: { transactionidentifier, useridentifier },
                ttl: 60 * 60 * 6
            }).catch(console.error);
        }
        
        // Verificar cache principal de vuelos directos
        const cachedFlights = await axios.post(`${BASE_URL}/api/cache`, {
            action: 'get',
            key: REDIS_KEY
        }).catch(() => null);
        
        // Verificar si hay APIs fallidas que no debemos reintentar aún
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
                console.log(`[${new Date().toISOString()}] DIRECT: Reintento automático activado para APIs fallidas`);
            }
        }
        
        // Si tenemos cache y no es momento de reintentar APIs fallidas, retornar cache
        if (cachedFlights && cachedFlights.data.success && shouldSkipFailedApis) {
            console.log(`[${new Date().toISOString()}] DIRECT: Retornando datos desde cache`);
            // Añadir un pequeño delay para que el usuario vea la barra de progreso
            await new Promise(resolve => setTimeout(resolve, 400));
            return res.status(200).json(cachedFlights.data.data);
        }
        
        // Si no hay cache, verificar si alguien más está procesando (PATRÓN DE BLOQUEO)
        const isProcessingResponse = await axios.post(`${BASE_URL}/api/cache`, {
            action: 'get',
            key: PROCESSING_KEY
        }).catch(() => null);
        
        if (isProcessingResponse && isProcessingResponse.data.success) {
            console.log(`[${new Date().toISOString()}] DIRECT: Otro proceso está ejecutando APIs, esperando...`);
            
            // Esperar hasta 25 segundos por el resultado
            for (let i = 0; i < 50; i++) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const newCachedFlights = await axios.post(`${BASE_URL}/api/cache`, {
                    action: 'get',
                    key: REDIS_KEY
                }).catch(() => null);
                
                if (newCachedFlights && newCachedFlights.data.success) {
                    console.log(`[${new Date().toISOString()}] DIRECT: Datos disponibles después de espera`);
                    return res.status(200).json(newCachedFlights.data.data);
                }
            }
            console.log(`[${new Date().toISOString()}] DIRECT: Timeout esperando datos, ejecutando APIs propias`);
        }
        
        // Intentar obtener el lock para ejecutar las APIs
        const lockResponse = await axios.post(`${BASE_URL}/api/cache`, {
            action: 'set',
            key: PROCESSING_KEY,
            data: Date.now(),
            ttl: 30, // 30 segundos de lock
            nx: true // Solo si no existe (NX)
        }).catch(() => null);
        
        // Si no se pudo obtener el lock (status 409 o error), otro proceso está ejecutando
        if (!lockResponse || lockResponse.status === 409 || !lockResponse.data.success) {
            // Otro proceso obtuvo el lock, esperar y verificar cache
            console.log(`[${new Date().toISOString()}] DIRECT: No se pudo obtener lock (${lockResponse?.status || 'error'}), esperando...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Reintentar verificación de cache después de espera
            const newCachedFlights = await axios.post(`${BASE_URL}/api/cache`, {
                action: 'get',
                key: REDIS_KEY
            }).catch(() => null);
            
            if (newCachedFlights && newCachedFlights.data.success) {
                console.log(`[${new Date().toISOString()}] DIRECT: Datos encontrados después de esperar lock`);
                return res.status(200).json(newCachedFlights.data.data);
            }
        }
        
        console.log(`[${new Date().toISOString()}] DIRECT: Obtenido lock para ejecutar APIs`);
        console.log(`[${new Date().toISOString()}] DIRECT: Iniciando llamadas concurrentes a APIs de vuelos directos`);
        
        // Llamadas concurrentes a todas las APIs de vuelos directos
        const directPromises = [];
        const departDates = ['2026-02-10', '2026-02-11', '2026-02-12', '2026-02-13'];
        
        departDates.forEach(departDate => {
            const apiEndpoint = `directo-${departDate.split('-')[2]}feb`;
            const promise = axios.post(`${BASE_URL}/api/${apiEndpoint}`, { 
                transactionidentifier, 
                useridentifier,
                departureDate: departDate
            }).catch(err => ({ 
                error: true, 
                departureDate: departDate,
                message: err.message 
            }));
            
            directPromises.push(promise);
        });
        
        const startTime = Date.now();
        const directResults = await Promise.allSettled(directPromises);
        const duration = Date.now() - startTime;
        
        console.log(`[${new Date().toISOString()}] DIRECT: Llamadas concurrentes completadas en ${duration}ms`);
        
        // Procesar resultados y mapear a estructura expandida
        const response = generateDirectFlightConfig();
        response.globalCheapest = null;
        
        const failedApis = [];
        let globalMinPrice = Infinity;
        let globalCheapestFlight = null;
        
        // Procesar cada resultado de vuelo directo
        directResults.forEach((result, index) => {
            const departDate = departDates[index];
            
            if (result.status === 'fulfilled' && result.value && !result.value.error) {
                const flightData = result.value.data;
                
                if (flightData && flightData.results) {
                    // Procesar cada fecha de regreso
                    Object.keys(flightData.results).forEach(returnDate => {
                        const flightInfo = flightData.results[returnDate];
                        
                        // Buscar el itinerario correspondiente en response
                        const itineraryKey = Object.keys(response).find(key => {
                            const item = response[key];
                            return item.departureDate === departDate && item.returnDate === returnDate;
                        });
                        
                        if (itineraryKey && !flightInfo.error) {
                            // Procesar como oferta
                            const processedFlight = processDirectFlight(flightInfo, response[itineraryKey]);
                            response[itineraryKey] = processedFlight;
                            
                            // Verificar si es el más barato globalmente
                            if (processedFlight.cheapest && parseFloat(processedFlight.cheapest.price) < globalMinPrice) {
                                globalMinPrice = parseFloat(processedFlight.cheapest.price);
                                globalCheapestFlight = {
                                    price: globalMinPrice,
                                    itinerary: `LIM ⇄ PTY`,
                                    type: 'Vuelo Directo',
                                    departureDate: departDate,
                                    returnDate: returnDate,
                                    data: flightInfo
                                };
                            }
                        } else if (itineraryKey && flightInfo.error) {
                            response[itineraryKey].error = flightInfo.error;
                            failedApis.push(`direct-${departDate}-${returnDate}`);
                        }
                    });
                } else {
                    failedApis.push(`direct-${departDate}-all`);
                }
            } else {
                // API falló completamente
                failedApis.push(`direct-${departDate}-complete`);
            }
        });
        
        // Establecer globalCheapest
        if (globalCheapestFlight) {
            response.globalCheapest = {
                ...globalCheapestFlight,
                ida: 'Lima - Panamá',
                vuelta: 'Panamá - Lima',
                stopoverType: '✈️ Vuelo Directo Sin Escalas',
                searchDate: globalCheapestFlight.departureDate,
                returnDate: globalCheapestFlight.returnDate,
                segments: generateDirectSegments(globalCheapestFlight, response)
            };
        }
        
        // Guardar en cache por 10 minutos
        await axios.post(`${BASE_URL}/api/cache`, {
            action: 'set',
            key: REDIS_KEY,
            data: response,
            ttl: 600 // 10 minutos
        }).catch(console.error);
        
        // Actualizar APIs fallidas si las hay
        if (failedApis.length > 0) {
            await axios.post(`${BASE_URL}/api/cache`, {
                action: 'set',
                key: FAILED_KEY,
                data: failedApis,
                ttl: 420 // 7 minutos
            }).catch(console.error);
            
            await axios.post(`${BASE_URL}/api/cache`, {
                action: 'set',
                key: FAILED_TIMESTAMP_KEY,
                data: Date.now(),
                ttl: 420 // 7 minutos
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
        
        console.log(`[${new Date().toISOString()}] DIRECT: Respuesta procesada exitosamente. APIs fallidas: ${failedApis.length}`);
        
        // Liberar el lock de procesamiento
        await axios.post(`${BASE_URL}/api/cache`, {
            action: 'del',
            key: PROCESSING_KEY
        }).catch(console.error);
        console.log(`[${new Date().toISOString()}] DIRECT: Lock de procesamiento liberado`);
        
        return res.status(200).json(response);
        
    } catch (error) {
        console.error('DIRECT: Error en función principal:', error);
        
        // Liberar el lock en caso de error
        await axios.post(`${BASE_URL}/api/cache`, {
            action: 'del',
            key: PROCESSING_KEY
        }).catch(console.error);
        console.log(`[${new Date().toISOString()}] DIRECT: Lock de procesamiento liberado por error`);
        
        return res.status(500).json({ 
            error: 'Error interno del servidor',
            message: error.message 
        });
    }
};

// Función auxiliar para procesar vuelos directos
function processDirectFlight(flightData, itineraryObj) {
    if (!flightData || flightData.error || !flightData.outbound || !flightData.return) {
        return { ...itineraryObj, error: flightData?.error || 'No se encontraron vuelos directos' };
    }
    
    // Crear una "oferta" simulada para mantener compatibilidad con la estructura stopover
    const totalPrice = flightData.totalPrice || 0;
    const offers = [{
        id: `direct-${flightData.departureDate}-${flightData.returnDate}`,
        solutionKeys: 'direct-flight',
        pricePerAdult: totalPrice.toFixed(2),
        fareFamily: 'Económica Basic',
        classOfService: 'Y'
    }];
    
    const routeInfo = [
        {
            route: `LIM → PTY`,
            departure: flightData.departureDate,
            arrival: flightData.departureDate,
            duration: flightData.outbound?.journeyTime || 'N/A'
        },
        {
            route: `PTY → LIM`,
            departure: flightData.returnDate,
            arrival: flightData.returnDate,
            duration: flightData.return?.journeyTime || 'N/A'
        }
    ];

    const cheapest = {
        price: totalPrice.toFixed(2),
        offerIds: [`direct-${flightData.departureDate}-${flightData.returnDate}`],
        segments: routeInfo,
        totalDuration: `${routeInfo.length} segmentos directos`
    };
    
    return {
        ...itineraryObj,
        offers: offers,
        cheapest,
        error: null
    };
}