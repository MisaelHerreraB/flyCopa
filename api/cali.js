const axios = require('axios');

async function fetchOffers(url, headers, payload) {
    try {
        const response = await axios.post(url, payload, { 
            headers,
            timeout: 25000
        });
        
        return response.data;
    } catch (error) {
        return { 
            error: `Error al conectar con la API: ${error.message}`,
            status: error.response ? error.response.status : null,
            statusText: error.response ? error.response.statusText : null
        };
    }
}

module.exports = async (req, res) => {
    const { 
        transactionidentifier, 
        useridentifier, 
        stopover = 'both',
        searchDate = '2026-02-13',
        returnDate = '2026-02-18'
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
        // Cali ida (LIM -> PTY -> CLO -> LIM)
        if (stopover === 'both' || stopover === 'ida') {
            const payload1 = {
                numberOfAdults: 1,
                numberOfChildren: 0,
                numberOfInfants: 0,
                cabinType: 'Y',
                isStopOver: true,
                originDestinations: [
                    { od: 'OD1', departure: { airportCode: 'LIM', date: searchDate }, arrival: { airportCode: 'PTY' } },
                    { od: 'OD2', departure: { airportCode: 'PTY', date: returnDate }, arrival: { airportCode: 'CLO' } },
                    { od: 'OD3', departure: { airportCode: 'CLO', date: returnDate }, arrival: { airportCode: 'LIM' } }
                ]
            };
            
            results.ida = await fetchOffers(url, headers, payload1);
        }
        
        // Cali regreso (LIM -> CLO -> PTY -> LIM)
        if (stopover === 'both' || stopover === 'regreso') {
            const payload2 = {
                numberOfAdults: 1,
                numberOfChildren: 0,
                numberOfInfants: 0,
                cabinType: 'Y',
                isStopOver: true,
                originDestinations: [
                    { od: 'OD1', departure: { airportCode: 'LIM', date: searchDate }, arrival: { airportCode: 'CLO' } },
                    { od: 'OD2', departure: { airportCode: 'CLO', date: searchDate }, arrival: { airportCode: 'PTY' } },
                    { od: 'OD3', departure: { airportCode: 'PTY', date: returnDate }, arrival: { airportCode: 'LIM' } }
                ]
            };
            
            results.regreso = await fetchOffers(url, headers, payload2);
        }
        
        return res.status(200).json({
            success: true,
            city: 'Cali',
            searchDate,
            returnDate,
            data: results,
            originDestinations: {
                ida: results.ida ? results.ida.originDestinations : null,
                regreso: results.regreso ? results.regreso.originDestinations : null
            }
        });
        
    } catch (error) {
        console.error('Error en función Cali:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            city: 'Cali',
            searchDate
        });
    }
};