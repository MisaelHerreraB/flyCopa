const axios = require('axios');

async function fetchDirectFlights(url, headers, payload, apiName = 'DIRECT_API') {
    const requestId = Math.random().toString(36).substring(2, 15);
    const startTime = Date.now();
    
    try {
        console.log(`\n=== [${new Date().toISOString()}] ${apiName} - REQUEST ${requestId} ===`);
        console.log(`URL: ${url}`);
        console.log(`HEADERS:`, JSON.stringify(headers, null, 2));
        console.log(`PAYLOAD:`, JSON.stringify(payload, null, 2));
        
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: url,
            headers: headers
        };
        
        const response = await axios.request(config);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`\n=== [${new Date().toISOString()}] ${apiName} - SUCCESS ${requestId} ===`);
        console.log(`DURATION: ${duration}ms`);
        console.log(`STATUS: ${response.status} ${response.statusText}`);
        console.log(`RESPONSE SIZE: ${JSON.stringify(response.data).length} characters`);
        
        // Procesar respuesta para encontrar vuelos más baratos
        if (response.data && Array.isArray(response.data) && response.data.length >= 2) {
            const outbound = response.data[0]; // Vuelos de ida
            const returnFlight = response.data[1]; // Vuelos de regreso
            
            let cheapestOutbound = null;
            let cheapestReturn = null;
            
            // Encontrar vuelo de ida más barato
            if (outbound.solutions && outbound.solutions.length > 0) {
                cheapestOutbound = outbound.solutions.reduce((min, solution) => {
                    return solution.lowestPriceCoachCabin < min.lowestPriceCoachCabin ? solution : min;
                });
            }
            
            // Encontrar vuelo de regreso más barato
            if (returnFlight.solutions && returnFlight.solutions.length > 0) {
                cheapestReturn = returnFlight.solutions.reduce((min, solution) => {
                    return solution.lowestPriceCoachCabin < min.lowestPriceCoachCabin ? solution : min;
                });
            }
            
            const totalPrice = (cheapestOutbound?.lowestPriceCoachCabin || 0) + (cheapestReturn?.lowestPriceCoachCabin || 0);
            
            console.log(`OUTBOUND CHEAPEST: $${cheapestOutbound?.lowestPriceCoachCabin || 'N/A'}`);
            console.log(`RETURN CHEAPEST: $${cheapestReturn?.lowestPriceCoachCabin || 'N/A'}`);
            console.log(`TOTAL PRICE: $${totalPrice}`);
        }
        
        console.log(`RESPONSE BODY:`, JSON.stringify(response.data, null, 2));
        console.log(`=========================================\n`);
        
        return response.data;
    } catch (error) {
        const endTime = Date.now();
        const duration = Date.now() - (startTime || Date.now());
        
        console.log(`\n=== [${new Date().toISOString()}] ${apiName} - ERROR ${requestId} ===`);
        console.log(`DURATION: ${duration}ms`);
        console.log(`ERROR MESSAGE: ${error.message}`);
        if (error.response) {
            console.log(`ERROR STATUS: ${error.response.status} ${error.response.statusText}`);
            console.log(`ERROR HEADERS:`, JSON.stringify(error.response.headers, null, 2));
            console.log(`ERROR BODY:`, JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log(`NO RESPONSE RECEIVED`);
            console.log(`REQUEST CONFIG:`, JSON.stringify(error.config, null, 2));
        }
        console.log(`ERROR STACK:`, error.stack);
        console.log(`=====================================\n`);
        
        return { 
            error: `Error al conectar con la API: ${error.message}`,
            status: error.response ? error.response.status : null,
            statusText: error.response ? error.response.statusText : null,
            requestId: requestId
        };
    }
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

    // Definir fecha de salida
    const departureDate = '2026-02-13';
    
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
    };
    
    const results = {};
    
    try {
        // Array de fechas de regreso para iterar (18, 19, 20 feb)
        const returnDates = ['2026-02-18', '2026-02-19', '2026-02-20'];
        
        for (const retDate of returnDates) {
            const url = `https://api.copaair.com/ibe/booking/plan?departureAirport1=LIM&arrivalAirport1=PTY&departureDate1=${departureDate}&adults=1&children=0&infants=0&isRoundTrip=true&departureAirport2=PTY&arrivalAirport2=LIM&departureDate2=${retDate}&promoCode=B9580&isConventionCode=true`;
            
            const apiName = `DIRECT_${departureDate}_TO_${retDate}`;
            
            const data = await fetchDirectFlights(url, headers, null, apiName);
            
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
                    error: data.error || 'Error desconocido',
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
        
        res.json({
            success: true,
            departureDate: departureDate,
            results: results,
            cheapest: cheapestCombination,
            summary: {
                totalCombinations: Object.keys(results).length,
                successfulCombinations: Object.values(results).filter(r => !r.error).length,
                cheapestPrice: cheapestPrice !== Infinity ? cheapestPrice : null
            }
        });
        
    } catch (error) {
        console.error('Error general en directo-13feb:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
};