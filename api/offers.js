const axios = require('axios');

module.exports = async (req, res) => {
    async function fetchOffers() {
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
            'transactionidentifier': '87ca92d5-c8fa-4777-9c90-3686f029b00e',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            'useridentifier': 'lZhE37jQmMEqjwZQPphOE',
            'Cookie': 'incap_ses_1720_2819721=cIY/dXaGL0RLChrvS6veF7qq3GgAAAAAY60WvRGwr7grrEGX+0+nPA==; nlbi_2819721=N9BRVjYGK03BgLfoKqYZMAAAAABsG7hTogBmgphNVsByFhe4; visid_incap_2819721=0ZnecVHbSp+SjvQkyGf2c7iq3GgAAAAAQUIPAAAAAADPyOHpLGA9q+odK9R/dHMH'
        };
        const payload = {
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

    try {
        const data = await fetchOffers();

        // Si hay error o no hay ofertas, devolver un error controlado
        if (data.error || !data.offers) {
            const errorMsg = data.error || 'No se pudieron obtener datos de la API';
            res.status(500).json({ 
                error: errorMsg,
                details: {
                    status: data.status || 'unknown',
                    statusText: data.statusText || 'unknown'
                }
            });
            return;
        }

        const offers = data.offers || [];
        if (!offers.length) {
            res.status(404).json({ error: 'No se encontraron ofertas.' });
            return;
        }

        let minPrice = Infinity;
        const cheapestOffers = [];

        const formattedOffers = offers.map(offer => {
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

        res.status(200).json({
            offers: formattedOffers,
            cheapest: {
                price: minPrice.toFixed(2),
                offerIds: cheapestOffers
            }
        });
    } catch (error) {
        res.status(500).json({ error: `Error en el servidor: ${error.message}` });
    }
};