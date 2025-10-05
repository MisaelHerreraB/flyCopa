// Configuración de fechas para búsquedas de vuelos
// Este módulo centraliza el manejo de fechas múltiples con fechas de regreso fijas

/**
 * Configuración de fechas de búsqueda
 */
const SEARCH_DATES = [
    '2026-02-11',
    '2026-02-12', 
    '2026-02-13'
];

/**
 * Configuración de fechas de regreso fijas
 */
const RETURN_DATES = [
    '2026-02-18',
    '2026-02-19',
    '2026-02-20'
];

/**
 * Genera todas las combinaciones de fechas de salida y regreso
 * @returns {Array} Array de objetos con fechas de salida y regreso
 */
function generateDateCombinations() {
    const combinations = [];
    SEARCH_DATES.forEach(searchDate => {
        RETURN_DATES.forEach(returnDate => {
            combinations.push({
                searchDate,
                returnDate,
                id: `${searchDate}_${returnDate}`
            });
        });
    });
    return combinations;
}

/**
 * Genera claves de Redis para cada combinación de fechas
 * @param {string} baseKey - Clave base sin fecha
 * @returns {Array} Array de objetos con fechas y claves de Redis
 */
function generateDateKeys(baseKey) {
    const combinations = generateDateCombinations();
    return combinations.map(combo => ({
        searchDate: combo.searchDate,
        returnDate: combo.returnDate,
        id: combo.id,
        key: `${baseKey}:${combo.id}`,
        processingKey: `flycopaapp:processing:${combo.id}`,
        failedKey: `flycopaapp:failed:${combo.id}`,
        failedTimestampKey: `flycopaapp:failed:timestamp:${combo.id}`
    }));
}

/**
 * Genera configuración de itinerarios para múltiples fechas con fechas de regreso fijas
 * @returns {Object} Configuración de itinerarios expandida (90 itinerarios total)
 */
function generateItineraryConfig() {
    const cities = [
        { name: 'Medellín', code: 'MDE' },
        { name: 'Quito', code: 'UIO' },
        { name: 'Cali', code: 'CLO' },
        { name: 'Bogotá', code: 'BOG' },
        { name: 'Cartagena', code: 'CTG' }
    ];
    
    const stopovers = ['ida', 'regreso'];
    const dateCombinations = generateDateCombinations();
    const config = {};
    let itineraryIndex = 1;
    
    // Para cada combinación de fechas (salida-regreso)
    dateCombinations.forEach(dateCombo => {
        // Para cada ciudad
        cities.forEach(city => {
            // Para cada tipo de stopover
            stopovers.forEach(stopover => {
                const key = `itinerary${itineraryIndex}`;
                const route = stopover === 'ida' 
                    ? `LIM -> PTY -> ${city.code} -> LIM`
                    : `LIM -> ${city.code} -> PTY -> LIM`;
                    
                config[key] = {
                    searchDate: dateCombo.searchDate,
                    returnDate: dateCombo.returnDate,
                    dateComboId: dateCombo.id,
                    city: city.name,
                    cityCode: city.code,
                    stopover,
                    itinerary: route,
                    offers: [],
                    cheapest: null,
                    error: null,
                    originDestinations: null
                };
                
                itineraryIndex++;
            });
        });
    });
    
    return config;
}

/**
 * Obtiene las fechas de búsqueda configuradas
 * @returns {Array} Array de fechas en formato YYYY-MM-DD
 */
function getSearchDates() {
    return [...SEARCH_DATES];
}

/**
 * Obtiene las fechas de regreso configuradas
 * @returns {Array} Array de fechas en formato YYYY-MM-DD
 */
function getReturnDates() {
    return [...RETURN_DATES];
}

/**
 * Obtiene todas las combinaciones de fechas
 * @returns {Array} Array de combinaciones de fechas
 */
function getDateCombinations() {
    return generateDateCombinations();
}

/**
 * Valida si una fecha está en el rango de búsqueda
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {boolean} True si la fecha es válida
 */
function isValidSearchDate(date) {
    return SEARCH_DATES.includes(date);
}

/**
 * Valida si una fecha está en el rango de regreso
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {boolean} True si la fecha es válida
 */
function isValidReturnDate(date) {
    return RETURN_DATES.includes(date);
}

/**
 * Genera el mapeo de ciudades para las llamadas a APIs
 * @returns {Array} Array de configuración de ciudades
 */
function getCityMapping() {
    return [
        { city: 'Medellín', endpoint: 'medellin' },
        { city: 'Quito', endpoint: 'quito' },
        { city: 'Cali', endpoint: 'cali' },
        { city: 'Bogotá', endpoint: 'bogota' },
        { city: 'Cartagena', endpoint: 'cartagena' }
    ];
}

module.exports = {
    SEARCH_DATES,
    RETURN_DATES,
    generateDateCombinations,
    generateDateKeys,
    generateItineraryConfig,
    getSearchDates,
    getReturnDates,
    getDateCombinations,
    isValidSearchDate,
    isValidReturnDate,
    getCityMapping
};