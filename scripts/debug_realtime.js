import axios from 'axios';
import jsMd5 from 'js-md5';

const generateDsatToken = (params) => {
    let queryString = "";
    Object.keys(params).forEach((key, index) => {
        queryString += (index === 0 ? "" : "&") + key + "=" + params[key];
    });
    const dirtyHash = jsMd5(queryString);
    const date = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const YYYY = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const DD = pad(date.getDate());
    const HH = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const timeStr = `${YYYY}${MM}${DD}${HH}${mm}`;
    let arr = dirtyHash.split("");
    const part3 = timeStr.slice(8);
    const part2 = timeStr.slice(4, 8);
    const part1 = timeStr.slice(0, 4);
    arr.splice(24, 0, part3);
    arr.splice(12, 0, part2);
    arr.splice(4, 0, part1);
    return arr.join("");
};

const probe = async (label, url, params) => {
    console.log(`\n--- Probing: ${label} ---`);
    const token = generateDsatToken(params);
    try {
        const res = await axios.post(url, new URLSearchParams(params).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'token': token,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            timeout: 5000
        });
        console.log(`Status: ${res.status}`);
        
        // Check for coordinates in response
        const data = res.data.data;
        if (data && data.routeInfo) {
             let foundBus = false;
             data.routeInfo.forEach(stop => {
                 if (stop.busInfo && stop.busInfo.length > 0) {
                     console.log("Found Bus Info at stop:", stop.staName);
                     console.log("Bus Data Sample:", JSON.stringify(stop.busInfo[0], null, 2));
                     foundBus = true;
                 }
             });
             if (!foundBus) console.log("No buses found in routeInfo.");
        } else if (Array.isArray(data)) {
            // routestation/location returns array directly?
            console.log("Data is array. Length:", data.length);
            if (data.length > 0) console.log("Sample:", JSON.stringify(data[0], null, 2));
        } else {
             console.log("Data structure unknown:", JSON.stringify(res.data, null, 2));
        }
    } catch (e) {
        console.log(`Error: ${e.message}`, e.response ? e.response.status : '');
    }
};

const run = async () => {
    // 1. Probe routestation/bus (Existing API)
    await probe("routestation/bus (Route 33)", 
        "https://bis.dsat.gov.mo:37812/macauweb/routestation/bus",
        {
            action: 'dy',
            routeName: '33',
            dir: '0',
            lang: 'zh-tw',
            routeType: '2', // Try 2 ?
            device: 'web'
        }
    );

    // 2. Probe routestation/location with routeName instead of routeCode
    await probe("routestation/location (routeName=33)", 
        "https://bis.dsat.gov.mo:37812/macauweb/routestation/location", 
        {
            routeName: '33',
            dir: '0',
            device: 'web',
            // request_id?
        }
    );
};

run();
