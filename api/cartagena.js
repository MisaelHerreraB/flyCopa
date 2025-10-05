const axios = require('axios');

async function fetchOffers(url, headers, payload, apiName = 'API') {
    const requestId = Math.random().toString(36).substring(2, 15);
    const startTime = Date.now();
    
    try {
        console.log(`\n=== [${new Date().toISOString()}] ${apiName} - REQUEST ${requestId} ===`);
        console.log(`URL: ${url}`);
        console.log(`HEADERS:`, JSON.stringify(headers, null, 2));
        console.log(`PAYLOAD:`, JSON.stringify(payload, null, 2));
        
        const response = await axios.post(url, payload, { 
            headers,
            timeout: 25000 // 25 segundos
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`\n=== [${new Date().toISOString()}] ${apiName} - SUCCESS ${requestId} ===`);
        console.log(`DURATION: ${duration}ms`);
        console.log(`STATUS: ${response.status} ${response.statusText}`);
        console.log(`RESPONSE HEADERS:`, JSON.stringify(response.headers, null, 2));
        console.log(`RESPONSE SIZE: ${JSON.stringify(response.data).length} characters`);
        if (response.data.offers) {
            console.log(`OFFERS FOUND: ${response.data.offers.length}`);
            if (response.data.offers.length > 0) {
                const prices = response.data.offers.map(o => o.pricePerAdult);
                console.log(`PRICE RANGE: $${Math.min(...prices)} - $${Math.max(...prices)}`);
            }
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
        stopover = 'both',
        searchDate = '2026-02-13', // Fecha de salida
        returnDate = '2026-02-18'  // Fecha de regreso
    } = req.body;
    
    if (!transactionidentifier || !useridentifier) {
        return res.status(400).json({ error: 'transactionidentifier y useridentifier son requeridos' });
    }
    
    const url = 'https://api.copaair.com/ibe/booking/plan-multicity';
    const headers = {
        'accept': '*/*',
        'accept-language': 'es-PA',
        'content-type': 'application/json',
        'origin': 'https://shopping.copaair.com',
        'priority': 'u=1, i',
        'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'storefront': 'GS',
        'transactionidentifier': transactionidentifier,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'useridentifier': useridentifier,
        'Cookie': 'incap_ses_1720_2819721=cIY/dXaGL0RLChrvS6veF7qq3GgAAAAAY60WvRGwr7grrEGX+0+nPA==; nlbi_2819721=N9BRVjYGK03BgLfoKqYZMAAAAABsG7hTogBmgphNVsByFhe4; visid_incap_2819721=0ZnecVHbSp+SjvQkyGf2c7iq3GgAAAAAQUIPAAAAAADPyOHpLGA9q+odK9R/dHMH'
    };
    
    const results = {};
    
    try {
        // Cartagena ida (LIM -> PTY -> CTG -> LIM)
        if (stopover === 'both' || stopover === 'ida') {
            const payload1 = {
                numberOfAdults: 1,
                numberOfChildren: 0,
                numberOfInfants: 0,
                cabinType: 'Y',
                isStopOver: true,
                originDestinations: [
                    { od: 'OD1', departure: { airportCode: 'LIM', date: searchDate }, arrival: { airportCode: 'PTY' } },
                    { od: 'OD2', departure: { airportCode: 'PTY', date: returnDate }, arrival: { airportCode: 'CTG' } },
                    { od: 'OD3', departure: { airportCode: 'CTG', date: returnDate }, arrival: { airportCode: 'LIM' } }
                ]
            };
            
            results.ida = await fetchOffers(url, headers, payload1, `Cartagena IDA (${searchDate})`);
        }
        
        // Cartagena regreso (LIM -> CTG -> PTY -> LIM)
        if (stopover === 'both' || stopover === 'regreso') {
            const payload2 = {
                numberOfAdults: 1,
                numberOfChildren: 0,
                numberOfInfants: 0,
                cabinType: 'Y',
                isStopOver: true,
                originDestinations: [
                    { od: 'OD1', departure: { airportCode: 'LIM', date: searchDate }, arrival: { airportCode: 'CTG' } },
                    { od: 'OD2', departure: { airportCode: 'CTG', date: searchDate }, arrival: { airportCode: 'PTY' } },
                    { od: 'OD3', departure: { airportCode: 'PTY', date: returnDate }, arrival: { airportCode: 'LIM' } }
                ]
            };
            
            results.regreso = await fetchOffers(url, headers, payload2, `Cartagena REGRESO (${searchDate})`);
        }
        
        return res.status(200).json({
            success: true,
            city: 'Cartagena',
            searchDate,
            returnDate,
            data: results,
            originDestinations: {
                ida: results.ida ? results.ida.originDestinations : null,
                regreso: results.regreso ? results.regreso.originDestinations : null
            }
        });
        
    } catch (error) {
        console.error('Error en función Cartagena:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            city: 'Cartagena',
            searchDate
        });
    }
};