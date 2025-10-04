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
    const { transactionidentifier, useridentifier, stopover = 'both' } = req.body;
    
    if (!transactionidentifier || !useridentifier) {
        return res.status(400).json({ error: 'transactionidentifier y useridentifier son requeridos' });
    }
    
    const url = 'https://uat-proxy.panama.prod.copaair.com/pdb/offer-context-search';
    const headers = {
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJwZGItb2ZmZXItY29udGV4dC1zZWFyY2giLCJzdWIiOiJwZGItb2ZmZXItY29udGV4dC1zZWFyY2giLCJzY29wZXMiOlsib2ZmZXItY29udGV4dC1zZWFyY2giXSwiaXNzIjoiZGItc2VydmljZSIsImV4cCI6MjAyNDAzMzEyMywiaWF0IjoxNzA4Njk5MTIzfQ.k2y1iHkqA6KOxqjdgpKRHdqB3qPk9qVqGE2Nw8sL6a0JqTcXV7kU9rO5mJ8H3LyI2pN8vQ9wC1kR7xA4zS6tH2uB9mG3fO8jE5lQ0rV9nH6bX1cN7wS4dM8fR2oL0pB6qE',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    
    const results = {};
    
    try {
        // Cartagena ida (LIM -> PTY -> CTG -> LIM)
        if (stopover === 'both' || stopover === 'ida') {
            const payload1 = {
                "searchRequestData": {
                    "transactionidentifier": transactionidentifier,
                    "useridentifier": useridentifier,
                    "version": "1.0",
                    "language": "es",
                    "passengerTypeQuantities": [{"passengerType": "ADT", "quantity": 1}],
                    "originDestinationRequests": [
                        {
                            "originLocationCode": "LIM",
                            "destinationLocationCode": "PTY",
                            "departureDate": "2026-02-13"
                        },
                        {
                            "originLocationCode": "PTY",
                            "destinationLocationCode": "CTG",
                            "departureDate": "2026-02-13"
                        },
                        {
                            "originLocationCode": "CTG",
                            "destinationLocationCode": "PTY",
                            "departureDate": "2026-02-15"
                        },
                        {
                            "originLocationCode": "PTY",
                            "destinationLocationCode": "LIM",
                            "departureDate": "2026-02-15"
                        }
                    ]
                }
            };
            
            results.ida = await fetchOffers(url, headers, payload1, 'Cartagena IDA');
        }
        
        // Cartagena regreso (LIM -> CTG -> PTY -> LIM)
        if (stopover === 'both' || stopover === 'regreso') {
            const payload2 = {
                "searchRequestData": {
                    "transactionidentifier": transactionidentifier,
                    "useridentifier": useridentifier,
                    "version": "1.0",
                    "language": "es",
                    "passengerTypeQuantities": [{"passengerType": "ADT", "quantity": 1}],
                    "originDestinationRequests": [
                        {
                            "originLocationCode": "LIM",
                            "destinationLocationCode": "CTG",
                            "departureDate": "2026-02-13"
                        },
                        {
                            "originLocationCode": "CTG",
                            "destinationLocationCode": "PTY",
                            "departureDate": "2026-02-13"
                        },
                        {
                            "originLocationCode": "PTY",
                            "destinationLocationCode": "LIM",
                            "departureDate": "2026-02-15"
                        }
                    ]
                }
            };
            
            results.regreso = await fetchOffers(url, headers, payload2, 'Cartagena REGRESO');
        }
        
        return res.status(200).json({
            success: true,
            city: 'Cartagena',
            data: results
        });
        
    } catch (error) {
        console.error('Error en función Cartagena:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            city: 'Cartagena'
        });
    }
};