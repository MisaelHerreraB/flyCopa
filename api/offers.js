
const axios = require('axios');
const { Redis } = require('@upstash/redis');

const redis = new Redis({
    url: process.env.fly_KV_REST_API_URL || "https://charmed-dane-16789.upstash.io",
    token: process.env.fly_KV_REST_API_TOKEN || "AUGVAAIncDI1M2Y5YjIxY2IxYWQ0ZDE5OGY2ZTFjOTU5YWZlZDU1ZnAyMTY3ODk"
});

module.exports = async (req, res) => {
    // Clave única para la cache de ofertas
    const REDIS_KEY = "copaair:offers:2026-02-13";

    // Intentar recuperar de Redis primero
    const cached = await redis.get(REDIS_KEY);
    if (cached) {
        // Si el valor es string, parsear a objeto
        let cachedData = cached;
        if (typeof cached === 'string') {
            try {
                cachedData = JSON.parse(cached);
            } catch (e) {
                // Si falla el parseo, devolver el string tal cual
            }
        }
        res.status(200).json(cachedData);
        return;
    }
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

    // Primera llamada (LIM -> PTY -> MDE -> LIM, stopover de ida)
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

    // Segunda llamada (LIM -> PTY -> UIO -> LIM, stopover de ida)
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

    // Tercera llamada (LIM -> PTY -> CLO -> LIM, stopover de ida)
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

    // Cuarta llamada (LIM -> PTY -> BOG -> LIM, stopover de ida)
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

    // Quinta llamada (LIM -> PTY -> CTG -> LIM, stopover de ida)
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

    // Sexta llamada (LIM -> MDE -> PTY -> LIM, stopover de regreso)
    const url6 = 'https://api.copaair.com/ibe/booking/plan-multicity';
    const payload6 = {
        numberOfAdults: 1,
        numberOfChildren: 0,
        numberOfInfants: 0,
        cabinType: 'Y',
        isStopOver: true,
        originDestinations: [
            { od: 'OD1', departure: { airportCode: 'LIM', date: '2026-02-13' }, arrival: { airportCode: 'MDE' } },
            { od: 'OD2', departure: { airportCode: 'MDE', date: '2026-02-13' }, arrival: { airportCode: 'PTY' } },
            { od: 'OD3', departure: { airportCode: 'PTY', date: '2026-02-18' }, arrival: { airportCode: 'LIM' } }
        ]
    };

    // Séptima llamada (LIM -> UIO -> PTY -> LIM, stopover de regreso)
    const url7 = 'https://api.copaair.com/ibe/booking/plan-multicity';
    const payload7 = {
        numberOfAdults: 1,
        numberOfChildren: 0,
        numberOfInfants: 0,
        cabinType: 'Y',
        isStopOver: true,
        originDestinations: [
            { od: 'OD1', departure: { airportCode: 'LIM', date: '2026-02-13' }, arrival: { airportCode: 'UIO' } },
            { od: 'OD2', departure: { airportCode: 'UIO', date: '2026-02-13' }, arrival: { airportCode: 'PTY' } },
            { od: 'OD3', departure: { airportCode: 'PTY', date: '2026-02-18' }, arrival: { airportCode: 'LIM' } }
        ]
    };

    // Octava llamada (LIM -> CLO -> PTY -> LIM, stopover de regreso)
    const url8 = 'https://api.copaair.com/ibe/booking/plan-multicity';
    const payload8 = {
        numberOfAdults: 1,
        numberOfChildren: 0,
        numberOfInfants: 0,
        cabinType: 'Y',
        isStopOver: true,
        originDestinations: [
            { od: 'OD1', departure: { airportCode: 'LIM', date: '2026-02-13' }, arrival: { airportCode: 'CLO' } },
            { od: 'OD2', departure: { airportCode: 'CLO', date: '2026-02-13' }, arrival: { airportCode: 'PTY' } },
            { od: 'OD3', departure: { airportCode: 'PTY', date: '2026-02-18' }, arrival: { airportCode: 'LIM' } }
        ]
    };

    // Novena llamada (LIM -> BOG -> PTY -> LIM, stopover de regreso)
    const url9 = 'https://api.copaair.com/ibe/booking/plan-multicity';
    const payload9 = {
        numberOfAdults: 1,
        numberOfChildren: 0,
        numberOfInfants: 0,
        cabinType: 'Y',
        isStopOver: true,
        originDestinations: [
            { od: 'OD1', departure: { airportCode: 'LIM', date: '2026-02-13' }, arrival: { airportCode: 'BOG' } },
            { od: 'OD2', departure: { airportCode: 'BOG', date: '2026-02-13' }, arrival: { airportCode: 'PTY' } },
            { od: 'OD3', departure: { airportCode: 'PTY', date: '2026-02-18' }, arrival: { airportCode: 'LIM' } }
        ]
    };

    // Décima llamada (LIM -> CTG -> PTY -> LIM, stopover de regreso)
    const url10 = 'https://api.copaair.com/ibe/booking/plan-multicity';
    const payload10 = {
        numberOfAdults: 1,
        numberOfChildren: 0,
        numberOfInfants: 0,
        cabinType: 'Y',
        isStopOver: true,
        originDestinations: [
            { od: 'OD1', departure: { airportCode: 'LIM', date: '2026-02-13' }, arrival: { airportCode: 'CTG' } },
            { od: 'OD2', departure: { airportCode: 'CTG', date: '2026-02-13' }, arrival: { airportCode: 'PTY' } },
            { od: 'OD3', departure: { airportCode: 'PTY', date: '2026-02-18' }, arrival: { airportCode: 'LIM' } }
        ]
    };

    try {
    // Solo si no hay cache, hacer las llamadas POST
    const data1 = await fetchOffers(url1, headers, payload1);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const data2 = await fetchOffers(url2, headers, payload2);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const data3 = await fetchOffers(url3, headers, payload3);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const data4 = await fetchOffers(url4, headers, payload4);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const data5 = await fetchOffers(url5, headers, payload5);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const data6 = await fetchOffers(url6, headers, payload6);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const data7 = await fetchOffers(url7, headers, payload7);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const data8 = await fetchOffers(url8, headers, payload8);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const data9 = await fetchOffers(url9, headers, payload9);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const data10 = await fetchOffers(url10, headers, payload10);

        // Procesar respuestas
        let response = {
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

        // Procesar primera llamada (MDE, stopover de ida)
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

        // Procesar segunda llamada (UIO, stopover de ida)
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

        // Procesar tercera llamada (CLO, stopover de ida)
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

        // Procesar cuarta llamada (BOG, stopover de ida)
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

        // Procesar quinta llamada (CTG, stopover de ida)
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

        // Procesar sexta llamada (MDE, stopover de regreso)
        if (data6.error || !data6.offers) {
            response.itinerary6.error = data6.error || 'No se pudieron obtener datos de la API';
        } else {
            const offers = data6.offers || [];
            let minPrice = Infinity;
            const cheapestOffers = [];

            response.itinerary6.offers = offers.map(offer => {
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
                response.itinerary6.cheapest = {
                    price: minPrice.toFixed(2),
                    offerIds: cheapestOffers
                };
            }
        }

        // Procesar séptima llamada (UIO, stopover de regreso)
        if (data7.error || !data7.offers) {
            response.itinerary7.error = data7.error || 'No se pudieron obtener datos de la API';
        } else {
            const offers = data7.offers || [];
            let minPrice = Infinity;
            const cheapestOffers = [];

            response.itinerary7.offers = offers.map(offer => {
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
                response.itinerary7.cheapest = {
                    price: minPrice.toFixed(2),
                    offerIds: cheapestOffers
                };
            }
        }

        // Procesar octava llamada (CLO, stopover de regreso)
        if (data8.error || !data8.offers) {
            response.itinerary8.error = data8.error || 'No se pudieron obtener datos de la API';
        } else {
            const offers = data8.offers || [];
            let minPrice = Infinity;
            const cheapestOffers = [];

            response.itinerary8.offers = offers.map(offer => {
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
                response.itinerary8.cheapest = {
                    price: minPrice.toFixed(2),
                    offerIds: cheapestOffers
                };
            }
        }

        // Procesar novena llamada (BOG, stopover de regreso)
        if (data9.error || !data9.offers) {
            response.itinerary9.error = data9.error || 'No se pudieron obtener datos de la API';
        } else {
            const offers = data9.offers || [];
            let minPrice = Infinity;
            const cheapestOffers = [];

            response.itinerary9.offers = offers.map(offer => {
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
                response.itinerary9.cheapest = {
                    price: minPrice.toFixed(2),
                    offerIds: cheapestOffers
                };
            }
        }

        // Procesar décima llamada (CTG, stopover de regreso)
        if (data10.error || !data10.offers) {
            response.itinerary10.error = data10.error || 'No se pudieron obtener datos de la API';
        } else {
            const offers = data10.offers || [];
            let minPrice = Infinity;
            const cheapestOffers = [];

            response.itinerary10.offers = offers.map(offer => {
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
                response.itinerary10.cheapest = {
                    price: minPrice.toFixed(2),
                    offerIds: cheapestOffers
                };
            }
        }

        // Comparar las ofertas más baratas
        const cheapestPrices = [
            response.itinerary1.cheapest ? { price: parseFloat(response.itinerary1.cheapest.price), itinerary: response.itinerary1.itinerary, city: response.itinerary1.city, stopover: response.itinerary1.stopover, offerIds: response.itinerary1.cheapest.offerIds } : null,
            response.itinerary2.cheapest ? { price: parseFloat(response.itinerary2.cheapest.price), itinerary: response.itinerary2.itinerary, city: response.itinerary2.city, stopover: response.itinerary2.stopover, offerIds: response.itinerary2.cheapest.offerIds } : null,
            response.itinerary3.cheapest ? { price: parseFloat(response.itinerary3.cheapest.price), itinerary: response.itinerary3.itinerary, city: response.itinerary3.city, stopover: response.itinerary3.stopover, offerIds: response.itinerary3.cheapest.offerIds } : null,
            response.itinerary4.cheapest ? { price: parseFloat(response.itinerary4.cheapest.price), itinerary: response.itinerary4.itinerary, city: response.itinerary4.city, stopover: response.itinerary4.stopover, offerIds: response.itinerary4.cheapest.offerIds } : null,
            response.itinerary5.cheapest ? { price: parseFloat(response.itinerary5.cheapest.price), itinerary: response.itinerary5.itinerary, city: response.itinerary5.city, stopover: response.itinerary5.stopover, offerIds: response.itinerary5.cheapest.offerIds } : null,
            response.itinerary6.cheapest ? { price: parseFloat(response.itinerary6.cheapest.price), itinerary: response.itinerary6.itinerary, city: response.itinerary6.city, stopover: response.itinerary6.stopover, offerIds: response.itinerary6.cheapest.offerIds } : null,
            response.itinerary7.cheapest ? { price: parseFloat(response.itinerary7.cheapest.price), itinerary: response.itinerary7.itinerary, city: response.itinerary7.city, stopover: response.itinerary7.stopover, offerIds: response.itinerary7.cheapest.offerIds } : null,
            response.itinerary8.cheapest ? { price: parseFloat(response.itinerary8.cheapest.price), itinerary: response.itinerary8.itinerary, city: response.itinerary8.city, stopover: response.itinerary8.stopover, offerIds: response.itinerary8.cheapest.offerIds } : null,
            response.itinerary9.cheapest ? { price: parseFloat(response.itinerary9.cheapest.price), itinerary: response.itinerary9.itinerary, city: response.itinerary9.city, stopover: response.itinerary9.stopover, offerIds: response.itinerary9.cheapest.offerIds } : null,
            response.itinerary10.cheapest ? { price: parseFloat(response.itinerary10.cheapest.price), itinerary: response.itinerary10.itinerary, city: response.itinerary10.city, stopover: response.itinerary10.stopover, offerIds: response.itinerary10.cheapest.offerIds } : null
        ].filter(item => item !== null);

        if (cheapestPrices.length) {
            const winner = cheapestPrices.reduce((min, curr) => curr.price < min.price ? curr : min);
            // Determinar ida, vuelta y tipo de stopover según el itinerario
            let ida = '';
            let vuelta = '';
            let stopoverType = '';
            let segments = [];
            // Buscar el objeto de itinerario correspondiente
            let itineraryObj = null;
            switch (winner.itinerary) {
                case 'LIM -> PTY -> MDE -> LIM':
                    ida = 'Lima - Panamá';
                    vuelta = 'Panamá - Medellín - Panamá - Lima';
                    stopoverType = '🛫 Stopover de ida en Panamá';
                    itineraryObj = response.itinerary1;
                    break;
                case 'LIM -> PTY -> UIO -> LIM':
                    ida = 'Lima - Panamá';
                    vuelta = 'Panamá - Quito - Panamá - Lima';
                    stopoverType = '🛫 Stopover de ida en Panamá';
                    itineraryObj = response.itinerary2;
                    break;
                case 'LIM -> PTY -> CLO -> LIM':
                    ida = 'Lima - Panamá';
                    vuelta = 'Panamá - Cali - Panamá - Lima';
                    stopoverType = '🛫 Stopover de ida en Panamá';
                    itineraryObj = response.itinerary3;
                    break;
                case 'LIM -> PTY -> BOG -> LIM':
                    ida = 'Lima - Panamá';
                    vuelta = 'Panamá - Bogotá - Panamá - Lima';
                    stopoverType = '🛫 Stopover de ida en Panamá';
                    itineraryObj = response.itinerary4;
                    break;
                case 'LIM -> PTY -> CTG -> LIM':
                    ida = 'Lima - Panamá';
                    vuelta = 'Panamá - Cartagena - Panamá - Lima';
                    stopoverType = '🛫 Stopover de ida en Panamá';
                    itineraryObj = response.itinerary5;
                    break;
                case 'LIM -> MDE -> PTY -> LIM':
                    ida = 'Lima - Panamá - Medellín - Panamá';
                    vuelta = 'Panamá - Lima';
                    stopoverType = '🛬 Stopover de regreso en Panamá';
                    itineraryObj = response.itinerary6;
                    break;
                case 'LIM -> UIO -> PTY -> LIM':
                    ida = 'Lima - Panamá - Quito - Panamá';
                    vuelta = 'Panamá - Lima';
                    stopoverType = '🛬 Stopover de regreso en Panamá';
                    itineraryObj = response.itinerary7;
                    break;
                case 'LIM -> CLO -> PTY -> LIM':
                    ida = 'Lima - Panamá - Cali - Panamá';
                    vuelta = 'Panamá - Lima';
                    stopoverType = '🛬 Stopover de regreso en Panamá';
                    itineraryObj = response.itinerary8;
                    break;
                case 'LIM -> BOG -> PTY -> LIM':
                    ida = 'Lima - Panamá - Bogotá - Panamá';
                    vuelta = 'Panamá - Lima';
                    stopoverType = '🛬 Stopover de regreso en Panamá';
                    itineraryObj = response.itinerary9;
                    break;
                case 'LIM -> CTG -> PTY -> LIM':
                    ida = 'Lima - Panamá - Cartagena - Panamá';
                    vuelta = 'Panamá - Lima';
                    stopoverType = '🛬 Stopover de regreso en Panamá';
                    itineraryObj = response.itinerary10;
                    break;
                default:
                    ida = '';
                    vuelta = '';
                    stopoverType = '';
            }
            // Extraer los detalles de los vuelos ganadores
            if (itineraryObj && itineraryObj.offers && itineraryObj.offers.length > 0) {
                // Buscar el objeto de oferta ganadora
                const offerId = winner.offerIds[0];
                const offer = itineraryObj.offers.find(o => o.id === offerId);
                if (offer) {
                    // Buscar los solutionKeys en la respuesta original
                    const solutionKeys = offer.solutionKeys.split(',').map(k => k.trim());
                    // Buscar los originDestinations en la respuesta original (dataX)
                    let originDestinations = null;
                    switch (winner.itinerary) {
                        case 'LIM -> PTY -> MDE -> LIM': originDestinations = data1.originDestinations; break;
                        case 'LIM -> PTY -> UIO -> LIM': originDestinations = data2.originDestinations; break;
                        case 'LIM -> PTY -> CLO -> LIM': originDestinations = data3.originDestinations; break;
                        case 'LIM -> PTY -> BOG -> LIM': originDestinations = data4.originDestinations; break;
                        case 'LIM -> PTY -> CTG -> LIM': originDestinations = data5.originDestinations; break;
                        case 'LIM -> MDE -> PTY -> LIM': originDestinations = data6.originDestinations; break;
                        case 'LIM -> UIO -> PTY -> LIM': originDestinations = data7.originDestinations; break;
                        case 'LIM -> CLO -> PTY -> LIM': originDestinations = data8.originDestinations; break;
                        case 'LIM -> BOG -> PTY -> LIM': originDestinations = data9.originDestinations; break;
                        case 'LIM -> CTG -> PTY -> LIM': originDestinations = data10.originDestinations; break;
                        default: originDestinations = null;
                    }
                    if (originDestinations) {
                        for (let i = 0; i < originDestinations.length; i++) {
                            const od = originDestinations[i];
                            // Buscar la solución correspondiente
                            const solutionKey = solutionKeys[i];
                            const solution = od.solutions.find(s => s.key === solutionKey);
                            if (solution && solution.flights && solution.flights.length > 0) {
                                // Puede haber más de un vuelo por solución (escalas)
                                solution.flights.forEach(flight => {
                                    segments.push({
                                        date: flight.departure.flightDate,
                                        from: flight.departure.airportCode,
                                        departure: flight.departure.flightTime,
                                        to: flight.arrival.airportCode,
                                        arrival: flight.arrival.flightTime,
                                        class: offer.fareFamily || 'Económica Basic',
                                        direct: solution.numberOfLayovers === 0,
                                        stops: solution.numberOfLayovers > 0 ? `${solution.numberOfLayovers} escala(s)` : 'Sin escalas',
                                        flightNumber: flight.marketingCarrier.flightNumber,
                                        aircraft: flight.aircraftName
                                    });
                                });
                            }
                        }
                    }
                }
            }
            response.globalCheapest = {
                ...winner,
                ida,
                vuelta,
                stopoverType,
                segments
            };
        }

        // Devolver respuesta
        if (!response.itinerary1.offers.length && !response.itinerary2.offers.length && !response.itinerary3.offers.length && 
            !response.itinerary4.offers.length && !response.itinerary5.offers.length && !response.itinerary6.offers.length && 
            !response.itinerary7.offers.length && !response.itinerary8.offers.length && !response.itinerary9.offers.length && 
            !response.itinerary10.offers.length) {
            res.status(404).json({ error: 'No se encontraron ofertas en ninguno de los itinerarios.' });
            return;
        }

    // Guardar en Redis para futuras consultas
    await redis.set(REDIS_KEY, response, { ex: 60 * 60 * 6 }); // Expira en 6 horas
    res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: `Error en el servidor: ${error.message}` });
    }
};