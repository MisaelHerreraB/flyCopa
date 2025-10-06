const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { getDateCombinations, generateItineraryConfig } = require('./utils/dateConfig');

// Función para generar segmentos reales basados en ofertas de Copa Airlines
function generateRealSegments(globalCheapest, allItineraries) {
    if (!globalCheapest || !globalCheapest.offerIds || globalCheapest.offerIds.length === 0) {
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
                    break;
                }
            }
            if (selectedOffer) break;
        }
    }
    
    if (!selectedOffer || !selectedOffer.solutionKeys || !selectedItinerary.originDestinations) {
        return null;
    }
    
    const segments = [];
    const solutionKeys = typeof selectedOffer.solutionKeys === 'string' 
        ? selectedOffer.solutionKeys.split(',').map(k => k.trim())
        : selectedOffer.solutionKeys;
    
    // Procesar cada originDestination usando los solutionKeys
    for (let i = 0; i < selectedItinerary.originDestinations.length && i < solutionKeys.length; i++) {
        const od = selectedItinerary.originDestinations[i];
        const solutionKey = solutionKeys[i];
        
        if (od.solutions && Array.isArray(od.solutions)) {
            const solution = od.solutions.find(s => s.key === solutionKey);
            
            if (solution && solution.flights && solution.flights.length > 0) {
                // Procesar cada vuelo en la solución
                solution.flights.forEach((flight) => {
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
            }
        }
    }
    
    return segments.length > 0 ? segments : null;
}





module.exports = async (req, res) => {
    const BASE_URL = req.headers['x-forwarded-proto'] && req.headers['x-forwarded-host'] 
        ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`
        : 'http://localhost:3000';
    
    // Obtener combinaciones de fechas configuradas
    const dateCombinations = getDateCombinations();
    const primaryCombo = dateCombinations[0]; // Combinación principal para claves de Redis
    
    // Definir claves de Redis al inicio para acceso global
    const REDIS_KEY = `mmm-vuelos-2026:ofertas:combinaciones-completas`;
    const PROCESSING_KEY = `mmm-vuelos-2026:procesando:combinaciones-activas`;
    const FAILED_KEY = `mmm-vuelos-2026:fallidas:apis-error`;
    const FAILED_TIMESTAMP_KEY = `mmm-vuelos-2026:timestamp:ultimo-error`;
    
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
                key: `mmm-vuelos-2026:identificadores:${period}`,
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
        
        console.log(`[${new Date().toISOString()}] Iniciando llamadas concurrentes a APIs especializadas para ${dateCombinations.length} combinaciones de fechas`);
        
        // Llamadas concurrentes a todas las funciones especializadas para múltiples combinaciones
        const cityPromises = [];
        
        // Para cada combinación de fechas
        dateCombinations.forEach(combo => {
            // Para cada ciudad
            const cities = ['medellin', 'quito', 'cali', 'bogota', 'cartagena'];
            cities.forEach(city => {
                const promise = axios.post(`${BASE_URL}/api/${city}`, { 
                    transactionidentifier, 
                    useridentifier,
                    stopover: 'both',
                    searchDate: combo.searchDate, // Fecha de salida específica
                    returnDate: combo.returnDate   // Fecha de regreso específica
                }).catch(err => ({ 
                    error: true, 
                    city: city.charAt(0).toUpperCase() + city.slice(1), 
                    searchDate: combo.searchDate,
                    returnDate: combo.returnDate,
                    message: err.message 
                }));
                
                cityPromises.push(promise);
            });
        });
        
        const startTime = Date.now();
        const cityResults = await Promise.allSettled(cityPromises);
        const duration = Date.now() - startTime;
        
        console.log(`[${new Date().toISOString()}] Llamadas concurrentes completadas en ${duration}ms`);
        
        // Procesar resultados y mapear a estructura expandida para múltiples combinaciones
        const response = generateItineraryConfig();
        response.globalCheapest = null;
        
        const failedApis = [];
        
        // Procesar cada resultado de ciudad con múltiples combinaciones de fechas
        cityResults.forEach((result, index) => {
            // Calcular qué ciudad y combinación de fechas corresponde a este índice
            const comboIndex = Math.floor(index / 5); // 5 ciudades por combinación
            const cityIndex = index % 5;
            const currentCombo = dateCombinations[comboIndex];
            const cities = ['Medellín', 'Quito', 'Cali', 'Bogotá', 'Cartagena'];
            const currentCity = cities[cityIndex];
            
            if (result.status === 'fulfilled' && result.value && !result.value.error) {
                const cityData = result.value.data;
                
                // Buscar itinerario para ida
                const idaItineraryKey = Object.keys(response).find(key => {
                    const item = response[key];
                    return item.searchDate === currentCombo.searchDate &&
                           item.returnDate === currentCombo.returnDate &&
                           item.city === currentCity &&
                           item.stopover === 'ida';
                });
                
                // Procesar ida
                if (cityData && cityData.data && cityData.data.ida && !cityData.data.ida.error) {
                    if (idaItineraryKey) {
                        response[idaItineraryKey] = processOffers(cityData.data.ida, response[idaItineraryKey]);
                        response[idaItineraryKey].originDestinations = cityData.originDestinations?.ida;
                    }
                } else {
                    failedApis.push(`${currentCity}-ida-${currentCombo.searchDate}-${currentCombo.returnDate}`);
                }
                
                // Buscar itinerario para regreso
                const regresoItineraryKey = Object.keys(response).find(key => {
                    const item = response[key];
                    return item.searchDate === currentCombo.searchDate &&
                           item.returnDate === currentCombo.returnDate &&
                           item.city === currentCity &&
                           item.stopover === 'regreso';
                });
                
                // Procesar regreso
                if (cityData && cityData.data && cityData.data.regreso && !cityData.data.regreso.error) {
                    if (regresoItineraryKey) {
                        response[regresoItineraryKey] = processOffers(cityData.data.regreso, response[regresoItineraryKey]);
                        response[regresoItineraryKey].originDestinations = cityData.originDestinations?.regreso;
                    }
                } else {
                    failedApis.push(`${currentCity}-regreso-${currentCombo.searchDate}-${currentCombo.returnDate}`);
                }
            } else {
                // API falló completamente
                failedApis.push(`${currentCity}-ida-${currentCombo.searchDate}-${currentCombo.returnDate}`, `${currentCity}-regreso-${currentCombo.searchDate}-${currentCombo.returnDate}`);
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
            
            // Encontrar el itinerario original para obtener las fechas
            const originalItinerary = Object.values(response).find(itinerary => 
                itinerary && 
                itinerary.cheapest && 
                itinerary.cheapest.price === winner.price.toString() &&
                itinerary.city === winner.city &&
                itinerary.stopover === winner.stopover
            );
            
            // Mapeo más eficiente para determinar rutas
            const routeMap = {
                'LIM -> PTY -> MDE -> LIM': { ida: 'Lima - Panamá', vuelta: 'Panamá - Medellín - Panamá - Lima', type: '🛫 Stopover de ida en Panamá' },
                'LIM -> PTY -> UIO -> LIM': { ida: 'Lima - Panamá', vuelta: 'Panamá - Quito - Panamá - Lima', type: '🛫 Stopover de ida en Panamá' },
                'LIM -> PTY -> CLO -> LIM': { ida: 'Lima - Panamá', vuelta: 'Panamá - Cali - Panamá - Lima', type: '🛫 Stopover de ida en Panamá' },
                'LIM -> PTY -> BOG -> LIM': { ida: 'Lima - Panamá', vuelta: 'Panamá - Bogotá - Panamá - Lima', type: '🛫 Stopover de ida en Panamá' },
                'LIM -> PTY -> CTG -> LIM': { ida: 'Lima - Panamá', vuelta: 'Panamá - Cartagena - Panamá - Lima', type: '🛫 Stopover de ida en Panamá' },
                'LIM -> MDE -> PTY -> LIM': { ida: 'Lima - Medellín - Panamá', vuelta: 'Panamá - Lima', type: '🛬 Stopover de regreso en Panamá' },
                'LIM -> UIO -> PTY -> LIM': { ida: 'Lima - Quito - Panamá', vuelta: 'Panamá - Lima', type: '🛬 Stopover de regreso en Panamá' },
                'LIM -> CLO -> PTY -> LIM': { ida: 'Lima - Cali - Panamá', vuelta: 'Panamá - Lima', type: '🛬 Stopover de regreso en Panamá' },
                'LIM -> BOG -> PTY -> LIM': { ida: 'Lima - Bogotá - Panamá', vuelta: 'Panamá - Lima', type: '🛬 Stopover de regreso en Panamá' },
                'LIM -> CTG -> PTY -> LIM': { ida: 'Lima - Cartagena - Panamá', vuelta: 'Panamá - Lima', type: '🛬 Stopover de regreso en Panamá' }
            };
            
            const route = routeMap[winner.itinerary] || { ida: '', vuelta: '', type: '' };
            
            response.globalCheapest = {
                ...winner,
                ida: route.ida,
                vuelta: route.vuelta,
                stopoverType: route.type,
                searchDate: originalItinerary ? originalItinerary.searchDate : null,
                returnDate: originalItinerary ? originalItinerary.returnDate : null,
                segments: generateRealSegments(winner, response)
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
    let cheapestOffer = null;

    const processedOffers = offers.map(offer => {
        const fareFamily = offer.fareFamilies ? `${offer.fareFamilies[0].name} (${offer.fareFamilies[0].code})` : 'N/A';
        if (offer.pricePerAdult < minPrice) {
            minPrice = offer.pricePerAdult;
            cheapestOffers.length = 0;
            cheapestOffers.push(offer.id);
            cheapestOffer = offer;
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

    // Extraer información de rutas y duración de originDestinations
    let routeInfo = null;
    let totalDuration = null;
    
    if (apiData.originDestinations && apiData.originDestinations.length > 0 && cheapestOffer) {
        const segments = [];
        
        // Procesar originDestinations - estructura: [{ od, departure: { airportCode, date }, arrival: { airportCode } }]
        apiData.originDestinations.forEach((od, index) => {
            if (od.departure && od.arrival) {
                segments.push({
                    route: `${od.departure.airportCode} → ${od.arrival.airportCode}`,
                    departure: od.departure.date || 'N/A',
                    arrival: od.arrival.date || 'N/A',
                    duration: 'N/A' // La API no provee duración individual por segmento
                });
            }
        });
        
        routeInfo = segments;
        // Como no tenemos duración individual, mostraremos la ruta completa
        if (segments.length > 0) {
            totalDuration = `${segments.length} segmento${segments.length > 1 ? 's' : ''}`;
        }
    }

    const cheapest = offers.length > 0 ? {
        price: minPrice.toFixed(2),
        offerIds: cheapestOffers,
        segments: routeInfo,
        totalDuration: totalDuration || 'N/A'
    } : null;
    
    return {
        ...itineraryObj,
        offers: processedOffers,
        cheapest,
        error: null
    };
}