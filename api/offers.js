const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Función para decodificar solutionKeys y extraer horarios reales
function decodeSolutionKey(solutionKey) {
    console.log(`[DEBUG] Decodificando solutionKey: ${solutionKey}`);
    // Formato esperado: "Iflt0300a82e1330a"
    // Los primeros 4 dígitos después de "Iflt" parecen ser la hora
    const timeMatch = solutionKey.match(/Iflt(\d{4})/);
    if (timeMatch) {
        const timeCode = timeMatch[1];
        // Convertir de formato HHMM a HH:MM
        const hours = timeCode.substring(0, 2);
        const minutes = timeCode.substring(2, 4);
        const result = `${hours}:${minutes}`;
        console.log(`[DEBUG] Extraído tiempo: ${result} de ${timeCode}`);
        return result;
    }
    console.log(`[DEBUG] No se pudo extraer tiempo de: ${solutionKey}`);
    return null;
}

// Función para generar segmentos reales basados en ofertas de Copa Airlines
function generateRealSegments(globalCheapest, allItineraries) {
    console.log('[DEBUG] generateRealSegments llamada con:', globalCheapest);
    console.log('[DEBUG] allItineraries keys:', Object.keys(allItineraries));
    
    if (!globalCheapest || !globalCheapest.offerIds || globalCheapest.offerIds.length === 0) {
        console.log('[DEBUG] No hay globalCheapest válido o sin offerIds');
        return null;
    }
    
    // Buscar la oferta más barata y el itinerario correspondiente
    let selectedOffer = null;
    let selectedItinerary = null;
    
    for (const [key, itinerary] of Object.entries(allItineraries)) {
        if (itinerary.offers && Array.isArray(itinerary.offers)) {
            for (const offer of itinerary.offers) {
                if (globalCheapest.offerIds.includes(offer.id)) {
                    selectedOffer = offer;
                    selectedItinerary = itinerary;
                    console.log(`[DEBUG] Encontrada oferta seleccionada: ${offer.id} en ${key}`);
                    break;
                }
            }
            if (selectedOffer) break;
        }
    }
    
    if (!selectedOffer || !selectedOffer.solutionKeys) {
        console.log('[DEBUG] No se encontró la oferta seleccionada o no tiene solutionKeys');
        return null;
    }
    
    if (!selectedItinerary.originDestinations) {
        console.log('[DEBUG] No hay originDestinations en el itinerario seleccionado');
        return null;
    }
    
    const segments = [];
    const solutionKeys = typeof selectedOffer.solutionKeys === 'string' 
        ? selectedOffer.solutionKeys.split(',').map(k => k.trim())
        : selectedOffer.solutionKeys;
    
    console.log('[DEBUG] solutionKeys de la oferta:', selectedOffer.solutionKeys);
    console.log('[DEBUG] originDestinations disponibles:', !!selectedItinerary.originDestinations);
    
    // Procesar cada originDestination usando los solutionKeys
    for (let i = 0; i < selectedItinerary.originDestinations.length && i < solutionKeys.length; i++) {
        const od = selectedItinerary.originDestinations[i];
        const solutionKey = solutionKeys[i];
        
        console.log(`[DEBUG] Procesando OD ${i}: buscando solution con key ${solutionKey}`);
        
        if (od.solutions && Array.isArray(od.solutions)) {
            const solution = od.solutions.find(s => s.key === solutionKey);
            
            if (solution && solution.flights && solution.flights.length > 0) {
                console.log(`[DEBUG] Encontrada solution con ${solution.flights.length} vuelos`);
                
                // Procesar cada vuelo en la solución (puede haber escalas)
                solution.flights.forEach((flight, flightIndex) => {
                    console.log(`[DEBUG] Procesando vuelo ${flightIndex}:`, {
                        from: flight.departure.airportCode,
                        departure: flight.departure.flightTime,
                        to: flight.arrival.airportCode,
                        arrival: flight.arrival.flightTime,
                        date: flight.departure.flightDate
                    });
                    
                    segments.push({
                        date: flight.departure.flightDate,
                        from: flight.departure.airportCode,
                        departure: flight.departure.flightTime,
                        to: flight.arrival.airportCode,
                        arrival: flight.arrival.flightTime,
                        class: selectedOffer.fareFamily || 'Económica Basic',
                        direct: solution.numberOfLayovers === 0,
                        stops: solution.numberOfLayovers > 0 ? `${solution.numberOfLayovers} escala(s)` : 'Sin escalas',
                        flightNumber: flight.marketingCarrier.flightNumber,
                        aircraft: flight.aircraftName || 'Boeing 737-800'
                    });
                });
            } else {
                console.log(`[DEBUG] No se encontró solution con key ${solutionKey} o no tiene vuelos`);
            }
        }
    }
    
    console.log(`[DEBUG] Total segmentos generados: ${segments.length}`);
    console.log('[DEBUG] Segmentos:', segments);
    
    return segments.length > 0 ? segments : null;
}

// Función auxiliar para sumar horas a un tiempo
function addHours(timeStr, hours) {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = h * 60 + m + (hours * 60);
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

// Función para generar segmentos básicos basados en el itinerario (fallback)
function generateBasicSegments(itinerary, city, stopover) {
    const segments = [];
    const cityNames = {
        'Medellín': 'MDE',
        'Quito': 'UIO', 
        'Cali': 'CLO',
        'Bogotá': 'BOG',
        'Cartagena': 'CTG'
    };
    
    const cityCode = cityNames[city] || 'MDE';
    
    if (stopover === 'ida') {
        // Stopover de ida: LIM -> PTY -> Ciudad -> LIM
        segments.push({
            date: '2026-02-13',
            from: 'LIM',
            departure: '08:00',
            to: 'PTY',
            arrival: '12:30',
            class: 'Económica Basic',
            direct: true,
            stops: 'Sin escalas',
            flightNumber: 'CM123',
            aircraft: 'Boeing 737-800'
        });
        segments.push({
            date: '2026-02-18',
            from: 'PTY',
            departure: '14:00',
            to: cityCode,
            arrival: '16:30',
            class: 'Económica Basic',
            direct: true,
            stops: 'Sin escalas',
            flightNumber: 'CM456',
            aircraft: 'Boeing 737-800'
        });
        segments.push({
            date: '2026-02-18',
            from: cityCode,
            departure: '18:00',
            to: 'LIM',
            arrival: '23:30',
            class: 'Económica Basic',
            direct: false,
            stops: '1 escala en PTY',
            flightNumber: 'CM789',
            aircraft: 'Boeing 737-800'
        });
    } else if (stopover === 'regreso') {
        // Stopover de regreso: LIM -> Ciudad -> PTY -> LIM
        segments.push({
            date: '2026-02-13',
            from: 'LIM',
            departure: '08:00',
            to: cityCode,
            arrival: '12:30',
            class: 'Económica Basic',
            direct: false,
            stops: '1 escala en PTY',
            flightNumber: 'CM123',
            aircraft: 'Boeing 737-800'
        });
        segments.push({
            date: '2026-02-13',
            from: cityCode,
            departure: '14:00',
            to: 'PTY',
            arrival: '16:30',
            class: 'Económica Basic',
            direct: true,
            stops: 'Sin escalas',
            flightNumber: 'CM456',
            aircraft: 'Boeing 737-800'
        });
        segments.push({
            date: '2026-02-18',
            from: 'PTY',
            departure: '18:00',
            to: 'LIM',
            arrival: '23:30',
            class: 'Económica Basic',
            direct: true,
            stops: 'Sin escalas',
            flightNumber: 'CM789',
            aircraft: 'Boeing 737-800'
        });
    }
    
    return segments;
}

module.exports = async (req, res) => {
    const BASE_URL = req.headers['x-forwarded-proto'] && req.headers['x-forwarded-host'] 
        ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`
        : 'http://localhost:3000';
    
    // Definir claves de Redis al inicio para acceso global
    const REDIS_KEY = "flycopaapp:offers:2026-02-13";
    const PROCESSING_KEY = "flycopaapp:processing:2026-02-13";
    const FAILED_KEY = "flycopaapp:failed:2026-02-13";
    const FAILED_TIMESTAMP_KEY = "flycopaapp:failed:timestamp:2026-02-13";
    
    try {
        // Generar identificadores para las APIs de Copa
        const now = new Date();
        const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-${String(now.getUTCDate()).padStart(2,'0')}-` + (now.getUTCHours()<12 ? 'AM' : 'PM');
        
        // Verificar cache de identificadores
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
            // Generar nuevos identificadores
            transactionidentifier = uuidv4();
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            useridentifier = Array.from({length: 21}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            
            // Guardar en cache por 6 horas
            await axios.post(`${BASE_URL}/api/cache`, {
                action: 'set',
                key: `flycopaapp:identifiers:${period}`,
                data: { transactionidentifier, useridentifier },
                ttl: 60 * 60 * 6
            }).catch(console.error);
        }
        
        // Verificar cache principal de ofertas
        const cachedOffers = await axios.post(`${BASE_URL}/api/cache`, {
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
                console.log(`[${new Date().toISOString()}] Reintento automático activado para APIs fallidas`);
            }
        }
        
        // Si tenemos cache y no es momento de reintentar APIs fallidas, retornar cache
        if (cachedOffers && cachedOffers.data.success && shouldSkipFailedApis) {
            console.log(`[${new Date().toISOString()}] Retornando datos desde cache`);
            // Añadir un pequeño delay para que el usuario vea la barra de progreso
            await new Promise(resolve => setTimeout(resolve, 400));
            return res.status(200).json(cachedOffers.data.data);
        }
        
        // Si no hay cache, verificar si alguien más está procesando (PATRÓN DE BLOQUEO)
        const isProcessingResponse = await axios.post(`${BASE_URL}/api/cache`, {
            action: 'get',
            key: PROCESSING_KEY
        }).catch(() => null);
        
        if (isProcessingResponse && isProcessingResponse.data.success) {
            console.log(`[${new Date().toISOString()}] Otro proceso está ejecutando APIs, esperando...`);
            
            // Esperar hasta 25 segundos por el resultado
            for (let i = 0; i < 50; i++) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const newCachedOffers = await axios.post(`${BASE_URL}/api/cache`, {
                    action: 'get',
                    key: REDIS_KEY
                }).catch(() => null);
                
                if (newCachedOffers && newCachedOffers.data.success) {
                    console.log(`[${new Date().toISOString()}] Datos disponibles después de espera`);
                    return res.status(200).json(newCachedOffers.data.data);
                }
            }
            console.log(`[${new Date().toISOString()}] Timeout esperando datos, ejecutando APIs propias`);
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
            console.log(`[${new Date().toISOString()}] No se pudo obtener lock (${lockResponse?.status || 'error'}), esperando...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Reintentar verificación de cache después de espera
            const newCachedOffers = await axios.post(`${BASE_URL}/api/cache`, {
                action: 'get',
                key: REDIS_KEY
            }).catch(() => null);
            
            if (newCachedOffers && newCachedOffers.data.success) {
                console.log(`[${new Date().toISOString()}] Datos encontrados después de esperar lock`);
                return res.status(200).json(newCachedOffers.data.data);
            }
        }
        
        console.log(`[${new Date().toISOString()}] Obtenido lock para ejecutar APIs`);
        
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
            
            console.log(`[${new Date().toISOString()}] Procesando resultado ${index} - ${cityInfo.city}:`);
            console.log(`Status: ${result.status}`);
            if (result.value) {
                console.log(`Value keys:`, Object.keys(result.value));
                if (result.value.data) {
                    console.log(`Data keys:`, Object.keys(result.value.data));
                }
            }
            
            if (result.status === 'fulfilled' && result.value && !result.value.error) {
                const cityData = result.value.data; // Esta es la respuesta de axios
                
                console.log(`[${new Date().toISOString()}] CityData para ${cityInfo.city}:`, cityData ? Object.keys(cityData) : 'null');
                
                // Procesar ida
                if (cityData && cityData.data && cityData.data.ida && !cityData.data.ida.error) {
                    response[cityInfo.idaItinerary] = processOffers(cityData.data.ida, response[cityInfo.idaItinerary]);
                    // Almacenar datos originales de ida
                    response[cityInfo.idaItinerary].originDestinations = cityData.originDestinations?.ida;
                } else {
                    response[cityInfo.idaItinerary].error = cityData?.data?.ida?.error || 'Error en stopover de ida';
                    failedApis.push(`${cityInfo.city}-ida`);
                }
                
                // Procesar regreso
                if (cityData && cityData.data && cityData.data.regreso && !cityData.data.regreso.error) {
                    response[cityInfo.regresoItinerary] = processOffers(cityData.data.regreso, response[cityInfo.regresoItinerary]);
                    // Almacenar datos originales de regreso
                    response[cityInfo.regresoItinerary].originDestinations = cityData.originDestinations?.regreso;
                } else {
                    response[cityInfo.regresoItinerary].error = cityData?.data?.regreso?.error || 'Error en stopover de regreso';
                    failedApis.push(`${cityInfo.city}-regreso`);
                }
            } else {
                console.log(`[${new Date().toISOString()}] Error en ${cityInfo.city}:`, result.reason || result.value);
                response[cityInfo.idaItinerary].error = result.value?.message || 'Error en función de ciudad';
                response[cityInfo.regresoItinerary].error = result.value?.message || 'Error en función de ciudad';
                failedApis.push(`${cityInfo.city}-ida`, `${cityInfo.city}-regreso`);
            }
        });
        
        // Debug: Verificar estado del response antes de calcular globalCheapest
        console.log(`[${new Date().toISOString()}] Verificando response antes de globalCheapest:`);
        Object.entries(response).forEach(([key, value]) => {
            if (value && typeof value === 'object') {
                console.log(`${key}: cheapest=${value.cheapest ? 'exists' : 'null'}, error=${value.error || 'none'}`);
            } else {
                console.log(`${key}: VALOR NULO O INVÁLIDO - value=${value}`);
            }
        });

        // Calcular globalCheapest con validación robusta
        const allCheapest = Object.values(response)
            .filter(itinerary => {
                const isValid = itinerary && 
                    typeof itinerary === 'object' && 
                    itinerary.cheapest !== null && 
                    itinerary.cheapest !== undefined &&
                    typeof itinerary.cheapest === 'object' &&
                    itinerary.cheapest.price !== null &&
                    itinerary.cheapest.price !== undefined &&
                    !isNaN(parseFloat(itinerary.cheapest.price));
                
                if (!isValid && itinerary) {
                    console.log(`[${new Date().toISOString()}] Filtrando itinerario inválido: ${itinerary.itinerary}, cheapest:`, itinerary.cheapest);
                }
                return isValid;
            })
            .map(itinerary => ({
                price: parseFloat(itinerary.cheapest.price),
                itinerary: itinerary.itinerary,
                city: itinerary.city,
                stopover: itinerary.stopover,
                offerIds: itinerary.cheapest.offerIds
            }))
            .sort((a, b) => a.price - b.price);

        // Crear globalCheapest con ida, vuelta y stopoverType
        if (allCheapest.length > 0) {
            const winner = allCheapest[0];
            let ida = '';
            let vuelta = '';
            let stopoverType = '';
            
            // Determinar ida, vuelta y tipo de stopover según el itinerario
            switch (winner.itinerary) {
                case 'LIM -> PTY -> MDE -> LIM':
                    ida = 'Lima - Panamá';
                    vuelta = 'Panamá - Medellín - Panamá - Lima';
                    stopoverType = '🛫 Stopover de ida en Panamá';
                    break;
                case 'LIM -> PTY -> UIO -> LIM':
                    ida = 'Lima - Panamá';
                    vuelta = 'Panamá - Quito - Panamá - Lima';
                    stopoverType = '🛫 Stopover de ida en Panamá';
                    break;
                case 'LIM -> PTY -> CLO -> LIM':
                    ida = 'Lima - Panamá';
                    vuelta = 'Panamá - Cali - Panamá - Lima';
                    stopoverType = '🛫 Stopover de ida en Panamá';
                    break;
                case 'LIM -> PTY -> BOG -> LIM':
                    ida = 'Lima - Panamá';
                    vuelta = 'Panamá - Bogotá - Panamá - Lima';
                    stopoverType = '🛫 Stopover de ida en Panamá';
                    break;
                case 'LIM -> PTY -> CTG -> LIM':
                    ida = 'Lima - Panamá';
                    vuelta = 'Panamá - Cartagena - Panamá - Lima';
                    stopoverType = '🛫 Stopover de ida en Panamá';
                    break;
                case 'LIM -> MDE -> PTY -> LIM':
                    ida = 'Lima - Medellín - Panamá';
                    vuelta = 'Panamá - Lima';
                    stopoverType = '🛬 Stopover de regreso en Panamá';
                    break;
                case 'LIM -> UIO -> PTY -> LIM':
                    ida = 'Lima - Quito - Panamá';
                    vuelta = 'Panamá - Lima';
                    stopoverType = '🛬 Stopover de regreso en Panamá';
                    break;
                case 'LIM -> CLO -> PTY -> LIM':
                    ida = 'Lima - Cali - Panamá';
                    vuelta = 'Panamá - Lima';
                    stopoverType = '🛬 Stopover de regreso en Panamá';
                    break;
                case 'LIM -> BOG -> PTY -> LIM':
                    ida = 'Lima - Bogotá - Panamá';
                    vuelta = 'Panamá - Lima';
                    stopoverType = '🛬 Stopover de regreso en Panamá';
                    break;
                case 'LIM -> CTG -> PTY -> LIM':
                    ida = 'Lima - Cartagena - Panamá';
                    vuelta = 'Panamá - Lima';
                    stopoverType = '🛬 Stopover de regreso en Panamá';
                    break;
                default:
                    ida = '';
                    vuelta = '';
                    stopoverType = '';
            }
            
            response.globalCheapest = {
                ...winner,
                ida,
                vuelta,
                stopoverType,
                segments: generateRealSegments(winner, response) || generateBasicSegments(winner.itinerary, winner.city, winner.stopover)
            };
        } else {
            response.globalCheapest = null;
        }
        
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
        
        // Liberar el lock de procesamiento
        await axios.post(`${BASE_URL}/api/cache`, {
            action: 'del',
            key: PROCESSING_KEY
        }).catch(console.error);
        console.log(`[${new Date().toISOString()}] Lock de procesamiento liberado`);
        
        return res.status(200).json(response);
        
    } catch (error) {
        console.error('Error en función principal:', error);
        
        // Liberar el lock en caso de error
        await axios.post(`${BASE_URL}/api/cache`, {
            action: 'del',
            key: PROCESSING_KEY
        }).catch(console.error);
        console.log(`[${new Date().toISOString()}] Lock de procesamiento liberado por error`);
        
        return res.status(500).json({ 
            error: 'Error interno del servidor',
            message: error.message 
        });
    }
};

// Función auxiliar para procesar ofertas
function processOffers(apiData, itineraryObj) {
    if (!apiData || apiData.error || !apiData.offers) {
        return { ...itineraryObj, error: apiData?.error || 'No se encontraron ofertas' };
    }
    
    const offers = apiData.offers;
    let minPrice = Infinity;
    const cheapestOffers = [];

    const processedOffers = offers.map(offer => {
        const fareFamily = offer.fareFamilies ? `${offer.fareFamilies[0].name} (${offer.fareFamilies[0].code})` : 'N/A';
        if (offer.pricePerAdult < minPrice) {
            minPrice = offer.pricePerAdult;
            cheapestOffers.length = 0;
            cheapestOffers.push(offer.id);
        } else if (offer.pricePerAdult === minPrice) {
            cheapestOffers.push(offer.id);
        }
        return {
            id: offer.id,
            solutionKeys: offer.solutionKeys.join(', '),
            pricePerAdult: offer.pricePerAdult.toFixed(2),
            fareFamily,
            classOfService: offer.classOfService.join(', ')
        };
    });

    const cheapest = offers.length > 0 ? {
        price: minPrice.toFixed(2),
        offerIds: cheapestOffers
    } : null;
    
    return {
        ...itineraryObj,
        offers: processedOffers,
        cheapest,
        error: null
    };
}