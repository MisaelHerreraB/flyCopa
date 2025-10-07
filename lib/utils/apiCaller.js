// Módulo para manejar llamadas concurrentes a APIs de ciudades
// Mantiene el patrón de bloqueo y concurrencia optimizada

const { getSearchDates, getCityMapping } = require('./dateConfig');

/**
 * Genera todas las llamadas a APIs para múltiples fechas y ciudades
 * @param {string} baseUrl - URL base del servidor
 * @param {string} transactionidentifier - ID de transacción
 * @param {string} useridentifier - ID de usuario
 * @returns {Array} Array de promesas para llamadas a APIs
 */
function generateCityApiCalls(baseUrl, transactionidentifier, useridentifier) {
    const dates = getSearchDates();
    const cities = getCityMapping();
    const promises = [];
    
    // Para cada fecha
    dates.forEach(date => {
        // Para cada ciudad
        cities.forEach(cityInfo => {
            const promise = fetch(`${baseUrl}/api/${cityInfo.endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactionidentifier,
                    useridentifier,
                    stopover: 'both',
                    searchDate: date // Nueva propiedad para fecha dinámica
                })
            })
            .then(response => response.json())
            .then(data => ({
                success: true,
                date,
                city: cityInfo.city,
                endpoint: cityInfo.endpoint,
                data
            }))
            .catch(error => ({
                success: false,
                date,
                city: cityInfo.city,
                endpoint: cityInfo.endpoint,
                error: error.message
            }));
            
            promises.push(promise);
        });
    });
    
    return promises;
}

/**
 * Procesa los resultados de las APIs y los mapea a la estructura de itinerarios
 * @param {Array} results - Resultados de Promise.allSettled
 * @param {Object} responseTemplate - Template de respuesta inicial
 * @returns {Object} Respuesta procesada con datos mapeados
 */
function processApiResults(results, responseTemplate) {
    const failedApis = [];
    const response = { ...responseTemplate };
    
    // Crear un mapa para encontrar rápidamente los itinerarios por fecha, ciudad y stopover
    const itineraryMap = {};
    Object.entries(response).forEach(([key, itinerary]) => {
        if (key !== 'globalCheapest' && itinerary.date && itinerary.city && itinerary.stopover) {
            const mapKey = `${itinerary.date}-${itinerary.city}-${itinerary.stopover}`;
            itineraryMap[mapKey] = key;
        }
    });
    
    // Procesar cada resultado
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value && result.value.success) {
            const apiResult = result.value;
            const { date, city, data } = apiResult;
            
            // Procesar ida
            if (data && data.data && data.data.ida && !data.data.ida.error) {
                const idaKey = `${date}-${city}-ida`;
                const itineraryKey = itineraryMap[idaKey];
                
                if (itineraryKey) {
                    response[itineraryKey] = processOffers(data.data.ida, response[itineraryKey]);
                    response[itineraryKey].originDestinations = data.originDestinations?.ida;
                }
            } else {
                const idaKey = `${date}-${city}-ida`;
                const itineraryKey = itineraryMap[idaKey];
                if (itineraryKey) {
                    response[itineraryKey].error = data?.data?.ida?.error || 'Error en stopover de ida';
                }
                failedApis.push(`${city}-ida-${date}`);
            }
            
            // Procesar regreso
            if (data && data.data && data.data.regreso && !data.data.regreso.error) {
                const regresoKey = `${date}-${city}-regreso`;
                const itineraryKey = itineraryMap[regresoKey];
                
                if (itineraryKey) {
                    response[itineraryKey] = processOffers(data.data.regreso, response[itineraryKey]);
                    response[itineraryKey].originDestinations = data.originDestinations?.regreso;
                }
            } else {
                const regresoKey = `${date}-${city}-regreso`;
                const itineraryKey = itineraryMap[regresoKey];
                if (itineraryKey) {
                    response[itineraryKey].error = data?.data?.regreso?.error || 'Error en stopover de regreso';
                }
                failedApis.push(`${city}-regreso-${date}`);
            }
        } else {
            // API falló completamente
            const apiInfo = extractApiInfoFromIndex(index);
            failedApis.push(`${apiInfo.city}-ida-${apiInfo.date}`, `${apiInfo.city}-regreso-${apiInfo.date}`);
        }
    });
    
    return { response, failedApis };
}

/**
 * Extrae información de la API basada en el índice del resultado
 * @param {number} index - Índice del resultado en el array
 * @returns {Object} Información de la API (ciudad, fecha)
 */
function extractApiInfoFromIndex(index) {
    const dates = getSearchDates();
    const cities = getCityMapping();
    
    const dateIndex = Math.floor(index / cities.length);
    const cityIndex = index % cities.length;
    
    return {
        date: dates[dateIndex] || dates[0],
        city: cities[cityIndex]?.city || 'Desconocida'
    };
}

/**
 * Función auxiliar para procesar ofertas (copiada del archivo principal)
 * @param {Object} apiData - Datos de la API
 * @param {Object} itineraryObj - Objeto de itinerario base
 * @returns {Object} Itinerario procesado
 */
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

module.exports = {
    generateCityApiCalls,
    processApiResults
};