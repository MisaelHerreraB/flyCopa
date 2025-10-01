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

    // Primera llamada (LIM -> PTY -> MDE -> LIM)
    const url1 = 'https://api.copaair.com/ibe/booking/plan-multicity';
    const headers1 = {
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
    const headers2 = {
        'accept': '*/*',
        'accept-language': 'es-PA',
        'content-type': 'application/json',
        'origin': 'https://shopping.copaair.com',
        'priority': 'u=1, i',
        'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'storefront': 'GS',
        'transactionidentifier': '1418c8f9-e66f-4a29-a681-4b678b7695b4',
        'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
        'useridentifier': 'rqV9yXxLI4BjzbOngz38v',
        'x-d-token': '3:uWJ0HS4oVaB65+sOv+Qzxg==:CM1/M4FPD8ASaL668q2M1Iucs6nnfiyIQ/E1xraCBBOE3M4GMFdtldKH5uDGfm5ulyjEUR4nruvbjUQqyY7HLaeRPpjPicmKYQqd6w54MkMTKMNHzK0lFuTeo6RRzTuBbs2mPRGxe+guOwOizL6UGnBzltw087GZEyZt4+SPt7QXfoeaEf2TGMiFjubpBzximyjDuBxZE2BNKBXGtdmgn6JCWjCnhxTaEsUzxaYEa7Bfn1cMmEpzfS1GbDnEOnyZhObmW5xxgaSrJvvdus46QnQUXIOyBi8Xne3lXciT/JU7eXnavyTfZNhNFStW4jI4SJdSqjDxOEUWBw5WCsxQ47MNHztBL4QWGwNxgGign5NUw2A57KLM47qpXMmWQsnM1umwsVbOutr5stFqhWP1xf0jYTEU22a+VjyrCJlvpJLhFk1OhOvKR2zoAQ6xZ/ttc1MurD166HC4FBoySlTTodCT7JGQGwODzd8khq8ds4ZscNv5bgxqpOUyTxFrU523GEWxcaHiY3mEsLPpa0uggy/hWWreEoHwWR40Ar2wIaenO7o+/xyCJxzliiyOkIALRyZawI/3QzamWPQl5LZ2B+wpK5noe0PyyMnCcFwltAw=:AZ+knoD2+/JrAMLZA4ZPvWNiWbkboV1gXE4lXXHgD6A=',
        'x-incap-spa-info': 'incap_ses_1720_2819721=TwKKIIrMSXYlUAHtS6veF4ir3GgAAAAA6t4fRqMw3rCQlgX5jD/Fvw==; visid_incap_2819721=WQVbEUEYSyOINhJLjTwBPuTt2mgAAAAAQUIPAAAAAABmo2lu90EvbO6BpyxSBnyw',
        'x-spa': '1',
        'Cookie': 'currentPos=CMgs; currentLang=es; _gcl_au=1.1.114121695.1759178202; lang=es; origin=ibe; containerApp=false; gdprcm=false; isMiles=null; visid_incap_2819721=WQVbEUEYSyOINhJLjTwBPuTt2mgAAAAAQUIPAAAAAABmo2lu90EvbO6BpyxSBnyw; visid_incap_2858083=E+WyXh+1R/+jFJkQ2l6oFoSr3GgAAAAAQUIPAAAAAABBnDnZMnzuQzTBeJ4qiO11; nlbi_2858083=r40zeZi2Zy5xBWLx960vUwAAAAAfjtL1hl0/V4knbZ9UBKzP; incap_ses_1720_2858083=wvQ1U2NxBBeAjhrvS6veF4Wr3GgAAAAA9s7Z/HXQgjaqz6UQsW3y8g==; _gid=GA1.2.1073242925.1759292296; nlbi_2819721=Y6Y1dywgaQyAUjwkKqYZMAAAAADZsAMzFcP/JTQcZBbF9ujB; incap_ses_1720_2819721=TwKKIIrMSXYlUAHtS6veF4ir3GgAAAAA6t4fRqMw3rCQlgX5jD/Fvw==; cm_exchange_rate=%5B%7B%22storefront%22%3A%22HN%22%2C%22currency%22%3A%22HNL%22%2C%22rate%22%3A0.03912%7D%2C%7B%22storefront%22%3A%22CL%22%2C%22currency%22%3A%22CLP%22%2C%22rate%22%3A0.00105%7D%2C%7B%22storefront%22%3A%22DO%22%2C%22currency%22%3A%22DOP%22%2C%22rate%22%3A0.01614%7D%2C%7B%22storefront%22%3A%22MX%22%2C%22currency%22%3A%22MXN%22%2C%22rate%22%3A0.04924%7D%2C%7B%22storefront%22%3A%22CO%22%2C%22currency%22%3A%22COP%22%2C%22rate%22%3A0.00024%7D%2C%7B%22storefront%22%3A%22GT%22%2C%22currency%22%3A%22GTQ%22%2C%22rate%22%3A0.12981%7D%2C%7B%22storefront%22%3A%22CR%22%2C%22currency%22%3A%22CRC%22%2C%22rate%22%3A0.00196%7D%2C%7B%22storefront%22%3A%22BR%22%2C%22currency%22%3A%22BRL%22%2C%22rate%22%3A0.17457%7D%2C%7B%22storefront%22%3A%22AR%22%2C%22currency%22%3A%22ARS%22%2C%22rate%22%3A0.00093%7D%2C%7B%22storefront%22%3A%22CU%22%2C%22currency%22%3A%22CUP%22%2C%22rate%22%3A0.04167%7D%2C%7B%22storefront%22%3A%22PE%22%2C%22currency%22%3A%22PEN%22%2C%22rate%22%3A0.2694%7D%2C%7B%22storefront%22%3A%22US%22%2C%22currency%22%3A%22USD%22%2C%22rate%22%3A1%7D%2C%7B%22storefront%22%3A%22CA%22%2C%22currency%22%3A%22CAD%22%2C%22rate%22%3A0.70531%7D%5D; rxVisitor=17592922982437TN6ADVTSG2TKBAMRA53VNI67O27905U; dtCookie=v_4_srv_3_sn_OE0MJ4U9BOEMPHCDMN0M0480VO38U08S_app-3A904bd5657b1304ac_1_ol_0_perc_100000_mul_1; c_rsc=1; uuid=rqV9yXxLI4BjzbOngz38v; _ga=GA1.1.1327571813.1759178202; dtSa=-; cm_metasearch=%5B%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%5D; datadome=WdyPYlWrjRW6jW7cHUqTcS1vj~jo~u1fVYhwxJdSadNCviHSSi1~MRVHiYuDk_c1Pad41fNbZxuALgKT5LZUcvpNjq0htfmI1bEdcXkHfTP8U_xlcH9xac_QRhabPhPR; reese84=3:uWJ0HS4oVaB65+sOv+Qzxg==:CM1/M4FPD8ASaL668q2M1Iucs6nnfiyIQ/E1xraCBBOE3M4GMFdtldKH5uDGfm5ulyjEUR4nruvbjUQqyY7HLaeRPpjPicmKYQqd6w54MkMTKMNHzK0lFuTeo6RRzTuBbs2mPRGxe+guOwOizL6UGnBzltw087GZEyZt4+SPt7QXfoeaEf2TGMiFjubpBzximyjDuBxZE2BNKBXGtdmgn6JCWjCnhxTaEsUzxaYEa7Bfn1cMmEpzfS1GbDnEOnyZhObmW5xxgaSrJvvdus46QnQUXIOyBi8Xne3lXciT/JU7eXnavyTfZNhNFStW4jI4SJdSqjDxOEUWBw5WCsxQ47MNHztBL4QWGwNxgGign5NUw2A57KLM47qpXMmWQsnM1umwsVbOutr5stFqhWP1xf0jYTEU22a+VjyrCJlvpJLhFk1OhOvKR2zoAQ6xZ/ttc1MurD166HC4FBoySlTTodCT7JGQGwODzd8khq8ds4ZscNv5bgxqpOUyTxFrU523GEWxcaHiY3mEsLPpa0uggy/hWWreEoHwWR40Ar2wIaenO7o+/xyCJxzliiyOkIALRyZawI/3QzamWPQl5LZ2B+wpK5noe0PyyMnCcFwltAw=:AZ+knoD2+/JrAMLZA4ZPvWNiWbkboV1gXE4lXXHgD6A=; Y29wYWFpci5jb20%3D-_lr_hb_-edny8h%2Fibe-s4n={%22heartbeat%22:1759299382553}; _uetsid=_uete481c49b; Y29wYWFpci5jb20%3D-_lr_tabs_-edny8h%2Fibe-s4n={%22recordingID%22:%226-01999e6a-2cf9-7a26-b957-528751bd4e64%22%2C%22sessionID%22:0%2C%22lastActivity%22:1759299383460%2C%22hasActivity%22:false%2C%22clearsIdentifiedUser%22:false%2C%22confirmed%22:true}; _ga_SEJ8DB2YNH=GS2.1.s1759292294$o3$g1$t1759299420$j22$l0$h1321509426; rxvt=1759301220207|1759292298244; dtPC=3$92998576_225h131vAJKFKEFBULRUVPCKKMPUOJOHTCAAVDPD-0e0'
    };
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
    const headers3 = {
        'accept': '*/*',
        'accept-language': 'es-PA',
        'content-type': 'application/json',
        'origin': 'https://shopping.copaair.com',
        'priority': 'u=1, i',
        'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'storefront': 'GS',
        'transactionidentifier': '76644bbf-ef8f-4f5b-9aad-4554b05ebea6',
        'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
        'useridentifier': 'rqV9yXxLI4BjzbOngz38v',
        'x-d-token': '3:pY7Us7dh9WTL7xBVZDPEtw==:jHZ7ytINst3Xvtmzg+yevKJcMmePcHF1KuCQLsh7gCHZz4wQJjQI7N4eeSnpoZ2Dy4zjeYEVfz8P9aVrXPOm9JCJk7MjY3dlvA7wWBXcZRgZAsaenjzuRyBbQWLxuZVdrPJSCZOqrpPN6C8dvwKsoopDAlEDIRi36D97/vd27k3SyATdNEIOACx595Zq5iI45YWRCmYazf5LlZK34SvfDGvKMH5dbLchNZigRT6jh7XcdUjrpP8YzVSrFZYiqaX1YAb5mzdBmlPPZDznhPzPZIAG+SLKePa+FWsbRN7NPQFT7GfbZz9RWwtdJ7Br0O8rsPNHUo9yHVOxqy/mFX9uI2gYt0DhabyYrSCuuqDuCIZt413QFHw9vqq5wEtZ1NHqKAa3zsJyA6Cs2bmxYswJA4QRNmqlP9uY+gbXWAFOcftwv6TPT+3joPelsIbV5rCrmNvvRuGx6F+r31Z9D4ETYaJy71xCzZqV6tTfbM1/aPO3syDVZNri1j9DJVvd1lJzAUVqp1fLSmW6KMCz/McEHPvZw0p/KN/Juhf1CNFpuVSrIcfdt7IU/0L9WN6Gc3uMKKaCbMjuvpFfwAc2oIgEva92RkuVT+NjCAJ4b/HQLTY=:DsotYFNlLxtPs0mGPbcz5DdOD1kuFLJQKPP7tkqn8NE=',
        'x-incap-spa-info': 'incap_ses_1720_2819721=TwKKIIrMSXYlUAHtS6veF4ir3GgAAAAA6t4fRqMw3rCQlgX5jD/Fvw==; visid_incap_2819721=WQVbEUEYSyOINhJLjTwBPuTt2mgAAAAAQUIPAAAAAABmo2lu90EvbO6BpyxSBnyw',
        'x-spa': '1',
        'Cookie': 'currentPos=CMgs; currentLang=es; _gcl_au=1.1.114121695.1759178202; lang=es; origin=ibe; containerApp=false; gdprcm=false; isMiles=null; visid_incap_2819721=WQVbEUEYSyOINhJLjTwBPuTt2mgAAAAAQUIPAAAAAABmo2lu90EvbO6BpyxSBnyw; visid_incap_2858083=E+WyXh+1R/+jFJkQ2l6oFoSr3GgAAAAAQUIPAAAAAABBnDnZMnzuQzTBeJ4qiO11; nlbi_2858083=r40zeZi2Zy5xBWLx960vUwAAAAAfjtL1hl0/V4knbZ9UBKzP; incap_ses_1720_2858083=wvQ1U2NxBBeAjhrvS6veF4Wr3GgAAAAA9s7Z/HXQgjaqz6UQsW3y8g==; _gid=GA1.2.1073242925.1759292296; nlbi_2819721=Y6Y1dywgaQyAUjwkKqYZMAAAAADZsAMzFcP/JTQcZBbF9ujB; incap_ses_1720_2819721=TwKKIIrMSXYlUAHtS6veF4ir3GgAAAAA6t4fRqMw3rCQlgX5jD/Fvw==; cm_exchange_rate=%5B%7B%22storefront%22%3A%22HN%22%2C%22currency%22%3A%22HNL%22%2C%22rate%22%3A0.03912%7D%2C%7B%22storefront%22%3A%22CL%22%2C%22currency%22%3A%22CLP%22%2C%22rate%22%3A0.00105%7D%2C%7B%22storefront%22%3A%22DO%22%2C%22currency%22%3A%22DOP%22%2C%22rate%22%3A0.01614%7D%2C%7B%22storefront%22%3A%22MX%22%2C%22currency%22%3A%22MXN%22%2C%22rate%22%3A0.04924%7D%2C%7B%22storefront%22%3A%22CO%22%2C%22currency%22%3A%22COP%22%2C%22rate%22%3A0.00024%7D%2C%7B%22storefront%22%3A%22GT%22%2C%22currency%22%3A%22GTQ%22%2C%22rate%22%3A0.12981%7D%2C%7B%22storefront%22%3A%22CR%22%2C%22currency%22%3A%22CRC%22%2C%22rate%22%3A0.00196%7D%2C%7B%22storefront%22%3A%22BR%22%2C%22currency%22%3A%22BRL%22%2C%22rate%22%3A0.17457%7D%2C%7B%22storefront%22%3A%22AR%22%2C%22currency%22%3A%22ARS%22%2C%22rate%22%3A0.00093%7D%2C%7B%22storefront%22%3A%22CU%22%2C%22currency%22%3A%22CUP%22%2C%22rate%22%3A0.04167%7D%2C%7B%22storefront%22%3A%22PE%22%2C%22currency%22%3A%22PEN%22%2C%22rate%22%3A0.2694%7D%2C%7B%22storefront%22%3A%22US%22%2C%22currency%22%3A%22USD%22%2C%22rate%22%3A1%7D%2C%7B%22storefront%22%3A%22CA%22%2C%22currency%22%3A%22CAD%22%2C%22rate%22%3A0.70531%7D%5D; rxVisitor=17592922982437TN6ADVTSG2TKBAMRA53VNI67O27905U; dtCookie=v_4_srv_3_sn_OE0MJ4U9BOEMPHCDMN0M0480VO38U08S_app-3A904bd5657b1304ac_1_ol_0_perc_100000_mul_1; c_rsc=1; uuid=rqV9yXxLI4BjzbOngz38v; _ga=GA1.1.1327571813.1759178202; dtSa=-; datadome=WdyPYlWrjRW6jW7cHUqTcS1vj~jo~u1fVYhwxJdSadNCviHSSi1~MRVHiYuDk_c1Pad41fNbZxuALgKT5LZUcvpNjq0htfmI1bEdcXkHfTP8U_xlcH9xac_QRhabPhPR; Y29wYWFpci5jb20%3D-_lr_hb_-edny8h%2Fibe-s4n={%22heartbeat%22:1759299382553}; Y29wYWFpci5jb20%3D-_lr_tabs_-edny8h%2Fibe-s4n={%22recordingID%22:%226-01999e6a-2cf9-7a26-b957-528751bd4e64%22%2C%22sessionID%22:0%2C%22lastActivity%22:1759299383460%2C%22hasActivity%22:false%2C%22clearsIdentifiedUser%22:false%2C%22confirmed%22:true}; cm_metasearch=%5B%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%5D; reese84=3:pY7Us7dh9WTL7xBVZDPEtw==:jHZ7ytINst3Xvtmzg+yevKJcMmePcHF1KuCQLsh7gCHZz4wQJjQI7N4eeSnpoZ2Dy4zjeYEVfz8P9aVrXPOm9JCJk7MjY3dlvA7wWBXcZRgZAsaenjzuRyBbQWLxuZVdrPJSCZOqrpPN6C8dvwKsoopDAlEDIRi36D97/vd27k3SyATdNEIOACx595Zq5iI45YWRCmYazf5LlZK34SvfDGvKMH5dbLchNZigRT6jh7XcdUjrpP8YzVSrFZYiqaX1YAb5mzdBmlPPZDznhPzPZIAG+SLKePa+FWsbRN7NPQFT7GfbZz9RWwtdJ7Br0O8rsPNHUo9yHVOxqy/mFX9uI2gYt0DhabyYrSCuuqDuCIZt413QFHw9vqq5wEtZ1NHqKAa3zsJyA6Cs2bmxYswJA4QRNmqlP9uY+gbXWAFOcftwv6TPT+3joPelsIbV5rCrmNvvRuGx6F+r31Z9D4ETYaJy71xCzZqV6tTfbM1/aPO3syDVZNri1j9DJVvd1lJzAUVqp1fLSmW6KMCz/McEHPvZw0p/KN/Juhf1CNFpuVSrIcfdt7IU/0L9WN6Gc3uMKKaCbMjuvpFfwAc2oIgEva92RkuVT+NjCAJ4b/HQLTY=:DsotYFNlLxtPs0mGPbcz5DdOD1kuFLJQKPP7tkqn8NE=; _uetsid=_uete481c49b; _ga_SEJ8DB2YNH=GS2.1.s1759292294$o3$g1$t1759300325$j32$l0$h1321509426; rxvt=1759302125322|1759292298244; dtPC=3$92998576_225h153vAJKFKEFBULRUVPCKKMPUOJOHTCAAVDPD-0e0'
    };
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
    const headers4 = {
        'accept': '*/*',
        'accept-language': 'es-PA',
        'content-type': 'application/json',
        'origin': 'https://shopping.copaair.com',
        'priority': 'u=1, i',
        'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'storefront': 'GS',
        'transactionidentifier': 'e7d58821-a461-48f5-840a-f07263f3d78a',
        'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
        'useridentifier': 'rqV9yXxLI4BjzbOngz38v',
        'x-d-token': '3:pY7Us7dh9WTL7xBVZDPEtw==:jHZ7ytINst3Xvtmzg+yevKJcMmePcHF1KuCQLsh7gCHZz4wQJjQI7N4eeSnpoZ2Dy4zjeYEVfz8P9aVrXPOm9JCJk7MjY3dlvA7wWBXcZRgZAsaenjzuRyBbQWLxuZVdrPJSCZOqrpPN6C8dvwKsoopDAlEDIRi36D97/vd27k3SyATdNEIOACx595Zq5iI45YWRCmYazf5LlZK34SvfDGvKMH5dbLchNZigRT6jh7XcdUjrpP8YzVSrFZYiqaX1YAb5mzdBmlPPZDznhPzPZIAG+SLKePa+FWsbRN7NPQFT7GfbZz9RWwtdJ7Br0O8rsPNHUo9yHVOxqy/mFX9uI2gYt0DhabyYrSCuuqDuCIZt413QFHw9vqq5wEtZ1NHqKAa3zsJyA6Cs2bmxYswJA4QRNmqlP9uY+gbXWAFOcftwv6TPT+3joPelsIbV5rCrmNvvRuGx6F+r31Z9D4ETYaJy71xCzZqV6tTfbM1/aPO3syDVZNri1j9DJVvd1lJzAUVqp1fLSmW6KMCz/McEHPvZw0p/KN/Juhf1CNFpuVSrIcfdt7IU/0L9WN6Gc3uMKKaCbMjuvpFfwAc2oIgEva92RkuVT+NjCAJ4b/HQLTY=:DsotYFNlLxtPs0mGPbcz5DdOD1kuFLJQKPP7tkqn8NE=',
        'x-incap-spa-info': 'incap_ses_1720_2819721=TwKKIIrMSXYlUAHtS6veF4ir3GgAAAAA6t4fRqMw3rCQlgX5jD/Fvw==; visid_incap_2819721=WQVbEUEYSyOINhJLjTwBPuTt2mgAAAAAQUIPAAAAAABmo2lu90EvbO6BpyxSBnyw',
        'x-spa': '1',
        'Cookie': 'currentPos=CMgs; currentLang=es; _gcl_au=1.1.114121695.1759178202; lang=es; origin=ibe; containerApp=false; gdprcm=false; isMiles=null; visid_incap_2819721=WQVbEUEYSyOINhJLjTwBPuTt2mgAAAAAQUIPAAAAAABmo2lu90EvbO6BpyxSBnyw; visid_incap_2858083=E+WyXh+1R/+jFJkQ2l6oFoSr3GgAAAAAQUIPAAAAAABBnDnZMnzuQzTBeJ4qiO11; nlbi_2858083=r40zeZi2Zy5xBWLx960vUwAAAAAfjtL1hl0/V4knbZ9UBKzP; incap_ses_1720_2858083=wvQ1U2NxBBeAjhrvS6veF4Wr3GgAAAAA9s7Z/HXQgjaqz6UQsW3y8g==; _gid=GA1.2.1073242925.1759292296; nlbi_2819721=Y6Y1dywgaQyAUjwkKqYZMAAAAADZsAMzFcP/JTQcZBbF9ujB; incap_ses_1720_2819721=TwKKIIrMSXYlUAHtS6veF4ir3GgAAAAA6t4fRqMw3rCQlgX5jD/Fvw==; cm_exchange_rate=%5B%7B%22storefront%22%3A%22HN%22%2C%22currency%22%3A%22HNL%22%2C%22rate%22%3A0.03912%7D%2C%7B%22storefront%22%3A%22CL%22%2C%22currency%22%3A%22CLP%22%2C%22rate%22%3A0.00105%7D%2C%7B%22storefront%22%3A%22DO%22%2C%22currency%22%3A%22DOP%22%2C%22rate%22%3A0.01614%7D%2C%7B%22storefront%22%3A%22MX%22%2C%22currency%22%3A%22MXN%22%2C%22rate%22%3A0.04924%7D%2C%7B%22storefront%22%3A%22CO%22%2C%22currency%22%3A%22COP%22%2C%22rate%22%3A0.00024%7D%2C%7B%22storefront%22%3A%22GT%22%2C%22currency%22%3A%22GTQ%22%2C%22rate%22%3A0.12981%7D%2C%7B%22storefront%22%3A%22CR%22%2C%22currency%22%3A%22CRC%22%2C%22rate%22%3A0.00196%7D%2C%7B%22storefront%22%3A%22BR%22%2C%22currency%22%3A%22BRL%22%2C%22rate%22%3A0.17457%7D%2C%7B%22storefront%22%3A%22AR%22%2C%22currency%22%3A%22ARS%22%2C%22rate%22%3A0.00093%7D%2C%7B%22storefront%22%3A%22CU%22%2C%22currency%22%3A%22CUP%22%2C%22rate%22%3A0.04167%7D%2C%7B%22storefront%22%3A%22PE%22%2C%22currency%22%3A%22PEN%22%2C%22rate%22%3A0.2694%7D%2C%7B%22storefront%22%3A%22US%22%2C%22currency%22%3A%22USD%22%2C%22rate%22%3A1%7D%2C%7B%22storefront%22%3A%22CA%22%2C%22currency%22%3A%22CAD%22%2C%22rate%22%3A0.70531%7D%5D; rxVisitor=17592922982437TN6ADVTSG2TKBAMRA53VNI67O27905U; dtCookie=v_4_srv_3_sn_OE0MJ4U9BOEMPHCDMN0M0480VO38U08S_app-3A904bd5657b1304ac_1_ol_0_perc_100000_mul_1; c_rsc=1; uuid=rqV9yXxLI4BjzbOngz38v; _ga=GA1.1.1327571813.1759178202; dtSa=-; datadome=WdyPYlWrjRW6jW7cHUqTcS1vj~jo~u1fVYhwxJdSadNCviHSSi1~MRVHiYuDk_c1Pad41fNbZxuALgKT5LZUcvpNjq0htfmI1bEdcXkHfTP8U_xlcH9xac_QRhabPhPR; Y29wYWFpci5jb20%3D-_lr_hb_-edny8h%2Fibe-s4n={%22heartbeat%22:1759299382553}; Y29wYWFpci5jb20%3D-_lr_tabs_-edny8h%2Fibe-s4n={%22recordingID%22:%226-01999e6a-2cf9-7a26-b957-528751bd4e64%22%2C%22sessionID%22:0%2C%22lastActivity%22:1759299383460%2C%22hasActivity%22:false%2C%22clearsIdentifiedUser%22:false%2C%22confirmed%22:true}; cm_metasearch=%5B%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%2C%22Standalone%20Form%22%5D; reese84=3:pY7Us7dh9WTL7xBVZDPEtw==:jHZ7ytINst3Xvtmzg+yevKJcMmePcHF1KuCQLsh7gCHZz4wQJjQI7N4eeSnpoZ2Dy4zjeYEVfz8P9aVrXPOm9JCJk7MjY3dlvA7wWBXcZRgZAsaenjzuRyBbQWLxuZVdrPJSCZOqrpPN6C8dvwKsoopDAlEDIRi36D97/vd27k3SyATdNEIOACx595Zq5iI45YWRCmYazf5LlZK34SvfDGvKMH5dbLchNZigRT6jh7XcdUjrpP8YzVSrFZYiqaX1YAb5mzdBmlPPZDznhPzPZIAG+SLKePa+FWsbRN7NPQFT7GfbZz9RWwtdJ7Br0O8rsPNHUo9yHVOxqy/mFX9uI2gYt0DhabyYrSCuuqDuCIZt413QFHw9vqq5wEtZ1NHqKAa3zsJyA6Cs2bmxYswJA4QRNmqlP9uY+gbXWAFOcftwv6TPT+3joPelsIbV5rCrmNvvRuGx6F+r31Z9D4ETYaJy71xCzZqV6tTfbM1/aPO3syDVZNri1j9DJVvd1lJzAUVqp1fLSmW6KMCz/McEHPvZw0p/KN/Juhf1CNFpuVSrIcfdt7IU/0L9WN6Gc3uMKKaCbMjuvpFfwAc2oIgEva92RkuVT+NjCAJ4b/HQLTY=:DsotYFNlLxtPs0mGPbcz5DdOD1kuFLJQKPP7tkqn8NE=; _uetsid=_uete481c49b; _ga_SEJ8DB2YNH=GS2.1.s1759292294$o3$g1$t1759301086$j6$l0$h1321509426; rxvt=1759302886256|1759292298244; dtPC=3$92998576_225h168vAJKFKEFBULRUVPCKKMPUOJOHTCAAVDPD-0e0'
    };
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

    try {
        // Primera llamada
        const data1 = await fetchOffers(url1, headers1, payload1);

        // Esperar 1.5 segundos
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Segunda llamada
        const data2 = await fetchOffers(url2, headers2, payload2);

        // Esperar 1.5 segundos
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Tercera llamada
        const data3 = await fetchOffers(url3, headers3, payload3);

        // Esperar 1.5 segundos
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Cuarta llamada
        const data4 = await fetchOffers(url4, headers4, payload4);

        // Procesar respuestas
        let response = {
            itinerary1: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> PTY -> MDE -> LIM', city: 'Medellín' },
            itinerary2: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> PTY -> UIO -> LIM', city: 'Quito' },
            itinerary3: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> PTY -> CLO -> LIM', city: 'Cali' },
            itinerary4: { offers: [], cheapest: null, error: null, itinerary: 'LIM -> PTY -> BOG -> LIM', city: 'Bogotá' },
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

        // Comparar las ofertas más baratas
        const cheapestPrices = [
            response.itinerary1.cheapest ? { price: parseFloat(response.itinerary1.cheapest.price), itinerary: response.itinerary1.itinerary, city: response.itinerary1.city, offerIds: response.itinerary1.cheapest.offerIds } : null,
            response.itinerary2.cheapest ? { price: parseFloat(response.itinerary2.cheapest.price), itinerary: response.itinerary2.itinerary, city: response.itinerary2.city, offerIds: response.itinerary2.cheapest.offerIds } : null,
            response.itinerary3.cheapest ? { price: parseFloat(response.itinerary3.cheapest.price), itinerary: response.itinerary3.itinerary, city: response.itinerary3.city, offerIds: response.itinerary3.cheapest.offerIds } : null,
            response.itinerary4.cheapest ? { price: parseFloat(response.itinerary4.cheapest.price), itinerary: response.itinerary4.itinerary, city: response.itinerary4.city, offerIds: response.itinerary4.cheapest.offerIds } : null
        ].filter(item => item !== null);

        if (cheapestPrices.length) {
            response.globalCheapest = cheapestPrices.reduce((min, curr) => curr.price < min.price ? curr : min);
        }

        // Devolver respuesta
        if (!response.itinerary1.offers.length && !response.itinerary2.offers.length && !response.itinerary3.offers.length && !response.itinerary4.offers.length) {
            res.status(404).json({ error: 'No se encontraron ofertas en ninguno de los itinerarios.' });
            return;
        }

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: `Error en el servidor: ${error.message}` });
    }
};