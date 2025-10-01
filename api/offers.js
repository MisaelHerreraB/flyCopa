const axios = require('axios');

module.exports = async (req, res) => {
    async function fetchOffers(url, headers, payload) {
        try {
            const response = await axios.post(url, payload, { headers });
            return response.data;
        } catch (error) {
            return { 
                error: `Error al conectar con la API: ${error.message}`,
                status: error.response ? error.response.status : null,
                statusText: error.response ? error.response.statusText : null
            };
        }
    }

    // Encabezados unificados para todas las llamadas
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
        'transactionidentifier': '87ca92d5-c8fa-4777-9c90-3686f029b00e',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'useridentifier': 'lZhE37jQmMEqjwZQPphOE',
        'Cookie': 'incap_ses_1720_2819721=cIY/dXaGL0RLChrvS6veF7qq3GgAAAAAY60WvRGwr7grrEGX+0+nPA==; nlbi_2819721=N9BRVjYGK03BgLfoKqYZMAAAAABsG7hTogBmgphNVsByFhe4; visid_incap_2819721=0ZnecVHbSp+SjvQkyGf2c7iq3GgAAAAAQUIPAAAAAADPyOHpLGA9q+odK9R/dHMH'
    };

    // Primera llamada (LIM -> PTY -> MDE -> LIM)
    const url1 = 'https://api.copaair.com/ibe/booking/plan-multicity';
    const payload1 = {
        numberOfAdults: 1,
        numberOfChildren: 0,
        numberOfInfants: 0,
        cabinType: 'Y',
        isStopOver: true,
        originDestinations: [
            { od: 'OD1', departure: { airportCode: 'LIM', date: '2026-02-13' }, arrival: { airportCode: 'PTY' } },
            { od: 'OD2', departure: { airportCode: 'PTY', date: '2026-02-18' }, arrival: { airportCode: 'MDE' } },
            { od: 'OD3', departure: { airportCode: 'MDE', date: '2026-02-18' }, arrival: { airportCode: 'LIM' } }
        ]
    };

    // Segunda llamada (LIM -> PTY -> UIO -> LIM)
    const url2 = 'https://api.copaair.com/ibe/booking/plan-multicity';
    const payload2 = {
        numberOfAdults: 1,
        numberOfChildren: 0,
        numberOfInfants: 0,
        cabinType: 'Y',
        isStopOver: true,
        originDestinations: [
            { od: 'OD1', departure: { airportCode: 'LIM', date: '2026-02-13' }, arrival: { airportCode: 'PTY' } },
            { od: 'OD2', departure: { airportCode: 'PTY', date: '2026-02-18' }, arrival: { airportCode: 'UIO' } },
            { od: 'OD3', departure: { airportCode: 'UIO', date: '2026-02-18' }, arrival: { airportCode: 'LIM' } }
        ]
    };

    // Tercera llamada (LIM -> PTY -> CLO -> LIM)
    const url3 = 'https://api.copaair.com/ibe/booking/plan-multicity';
    const payload3 = {
        numberOfAdults: 1,
        numberOfChildren: 0,
        numberOfInfants: 0,
        cabinType: 'Y',
        isStopOver: true,
        originDestinations: [
            { od: 'OD1', departure: { airportCode: 'LIM', date: '2026-02-13' }, arrival: { airportCode: 'PTY' } },
            { od: 'OD2', departure: { airportCode: 'PTY', date: '2026-02-18' }, arrival: { airportCode: 'CLO' } },
            { od: 'OD3', departure: { airportCode: 'CLO', date: '2026-02-18' }, arrival: { airportCode: 'LIM' } }
        ]
    };

    // Cuarta llamada (LIM -> PTY -> BOG -> LIM)
    const url4 = 'https://api.copaair.com/ibe/booking/plan-multicity';
    const payload4 = {
        numberOfAdults: 1,
        numberOfChildren: 0,
        numberOfInfants: 0,
        cabinType: 'Y',
        isStopOver: true,
        originDestinations: [
            { od: 'OD1', departure: { airportCode: 'LIM', date: '2026-02-13' }, arrival: { airportCode: 'PTY' } },
            { od: 'OD2', departure: { airportCode: 'PTY', date: '2026-02-18' }, arrival: { airportCode: 'BOG' } },
            { od: 'OD3', departure: { airportCode: 'BOG', date: '2026-02-18' }, arrival: { airportCode: 'LIM' } }
        ]
    };

    // Quinta llamada (LIM -> PTY -> CTG -> LIM)
    const url5 = 'https://api.copaair.com/ibe/booking/plan-multicity';
    const payload5 = {
        numberOfAdults: 1,
        numberOfChildren: 0,
        numberOfInfants: 0,
        cabinType: 'Y',
        isStopOver: true,
        originDestinations: [
            { od: 'OD1', departure: { airportCode: 'LIM', date: '2026-02-13' }, arrival: { airportCode: 'PTY' } },
            { od: 'OD2', departure: { airportCode: 'PTY', date: '2026-02-18' }, arrival: { airportCode: 'CTG' } },
            { od: 'OD3', departure: { airportCode: 'CTG', date: '2026-02-18' }, arrival: { airportCode: 'LIM' } }
        ]
    };

    try {
        // Primera llamada
        const data1 = await fetchOffers(url1, headers, payload1);

        // Esperar 1.5 segundos
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Segunda llamada
        const data2 = await fetchOffers(url2, headers, payload2);

        // Esperar 1.5 segundos
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Tercera llamada
        const data3 = await fetchOffers(url3, headers, payload3);

        // Esperar 1.5 segundos
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Cuarta llamada
        const data4 = await fetchOffers(url4, headers, payload4);

        // Esperar 1.5 segundos
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Quinta llamada
        const data5 = await fetchOffers(url5, headers, payload5);

        // Procesar respuestas
        let response = {
            itinerary1: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> PTY -> MDE -> LIM', city: 'Medellín' },
            itinerary2: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> PTY -> UIO -> LIM', city: 'Quito' },
            itinerary3: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> PTY -> CLO -> LIM', city: 'Cali' },
            itinerary4: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> PTY -> BOG -> LIM', city: 'Bogotá' },
            itinerary5: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> PTY -> CTG -> LIM', city: 'Cartagena' },
            globalCheapest: null
        };

        // Procesar primera llamada (MDE)
        if (data1.error || !data1.offers) {
            response.itinerary1.error = data1.error || 'No se pudieron obtener datos de la API';
        } else {
            const offers = data1.offers || [];
            let minPrice = Infinity;
            const cheapestOffers = [];

            response.itinerary1.offers = offers.map(offer => {
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

            if (offers.length) {
                response.itinerary1.cheapest = {
                    price: minPrice.toFixed(2),
                    offerIds: cheapestOffers
                };
            }
        }

        // Procesar segunda llamada (UIO)
        if (data2.error || !data2.offers) {
            response.itinerary2.error = data2.error || 'No se pudieron obtener datos de la API';
        } else {
            const offers = data2.offers || [];
            let minPrice = Infinity;
            const cheapestOffers = [];

            response.itinerary2.offers = offers.map(offer => {
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

            if (offers.length) {
                response.itinerary2.cheapest = {
                    price: minPrice.toFixed(2),
                    offerIds: cheapestOffers
                };
            }
        }

        // Procesar tercera llamada (CLO)
        if (data3.error || !data3.offers) {
            response.itinerary3.error = data3.error || 'No se pudieron obtener datos de la API';
        } else {
            const offers = data3.offers || [];
            let minPrice = Infinity;
            const cheapestOffers = [];

            response.itinerary3.offers = offers.map(offer => {
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

            if (offers.length) {
                response.itinerary3.cheapest = {
                    price: minPrice.toFixed(2),
                    offerIds: cheapestOffers
                };
            }
        }

        // Procesar cuarta llamada (BOG)
        if (data4.error || !data4.offers) {
            response.itinerary4.error = data4.error || 'No se pudieron obtener datos de la API';
        } else {
            const offers = data4.offers || [];
            let minPrice = Infinity;
            const cheapestOffers = [];

            response.itinerary4.offers = offers.map(offer => {
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

            if (offers.length) {
                response.itinerary4.cheapest = {
                    price: minPrice.toFixed(2),
                    offerIds: cheapestOffers
                };
            }
        }

        // Procesar quinta llamada (CTG)
        if (data5.error || !data5.offers) {
            response.itinerary5.error = data5.error || 'No se pudieron obtener datos de la API';
        } else {
            const offers = data5.offers || [];
            let minPrice = Infinity;
            const cheapestOffers = [];

            response.itinerary5.offers = offers.map(offer => {
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

            if (offers.length) {
                response.itinerary5.cheapest = {
                    price: minPrice.toFixed(2),
                    offerIds: cheapestOffers
                };
            }
        }

        // Comparar las ofertas más baratas
        const cheapestPrices = [
            response.itinerary1.cheapest ? { price: parseFloat(response.itinerary1.cheapest.price), itinerary: response.itinerary1.itinerary, city: response.itinerary1.city, offerIds: response.itinerary1.cheapest.offerIds } : null,
            response.itinerary2.cheapest ? { price: parseFloat(response.itinerary2.cheapest.price), itinerary: response.itinerary2.itinerary, city: response.itinerary2.city, offerIds: response.itinerary2.cheapest.offerIds } : null,
            response.itinerary3.cheapest ? { price: parseFloat(response.itinerary3.cheapest.price), itinerary: response.itinerary3.itinerary, city: response.itinerary3.city, offerIds: response.itinerary3.cheapest.offerIds } : null,
            response.itinerary4.cheapest ? { price: parseFloat(response.itinerary4.cheapest.price), itinerary: response.itinerary4.itinerary, city: response.itinerary4.city, offerIds: response.itinerary4.cheapest.offerIds } : null,
            response.itinerary5.cheapest ? { price: parseFloat(response.itinerary5.cheapest.price), itinerary: response.itinerary5.itinerary, city: response.itinerary5.city, offerIds: response.itinerary5.cheapest.offerIds } : null
        ].filter(item => item !== null);

        if (cheapestPrices.length) {
            response.globalCheapest = cheapestPrices.reduce((min, curr) => curr.price < min.price ? curr : min);
        }

        // Devolver respuesta
        if (!response.itinerary1.offers.length && !response.itinerary2.offers.length && !response.itinerary3.offers.length && !response.itinerary4.offers.length && !response.itinerary5.offers.length) {
            res.status(404).json({ error: 'No se encontraron ofertas en ninguno de los itinerarios.' });
            return;
        }

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: `Error en el servidor: ${error.message}` });
    }
};