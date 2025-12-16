const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');

// --- Crypto Helper (Same as usual) ---
function md5(str) { return crypto.createHash('md5').update(str).digest('hex'); }
function generateDsatToken(params) {
    let queryString = "";
    Object.keys(params).forEach((key, index) => { queryString += (index === 0 ? "" : "&") + key + "=" + params[key]; });
    const dirtyHash = md5(queryString);
    const date = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const timeStr = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}`;
    let arr = dirtyHash.split("");
    arr.splice(24, 0, timeStr.slice(8));
    arr.splice(12, 0, timeStr.slice(4, 8));
    arr.splice(4, 0, timeStr.slice(0, 4));
    return arr.join("");
}

// --- Fetch Helper ---
async function fetchMapLocation(route, dir) {
      const routeCodePadded = route.trim().toString().padStart(5, '0');
      const params = { routeName: route.trim(), dir: dir, lang: 'zh-tw', routeCode: routeCodePadded };
      const token = generateDsatToken(params);
      const url = 'https://bis.dsat.gov.mo:37812/macauweb/routestation/location';
      const qs = new URLSearchParams(params).toString();
      const finalUrl = `${url}?${qs}&t=${Date.now()}`;
      try {
          const res = await axios.get(finalUrl, { headers: { 'token': token, 'X-Requested-With': 'XMLHttpRequest' } });
          return res.data?.data?.stationInfoList || [];
      } catch (e) {
          console.error(`Error ${route} ${dir}:`, e.message);
          return [];
      }
}

// --- Main Script ---
(async () => {
    console.log("Reading gov_data.json...");
    // Read RAW file to preserve structure
    const rawData = JSON.parse(fs.readFileSync('src/data/gov_data.json', 'utf8'));
    const stopsOriginal = rawData.stops;

    // Build lookup for fast access: Code -> StopObject(s)
    // Note: Multiple stops might share code (e.g. diff directions or duplicates) 
    // We update ALL matching codes.
    // Normalized Code: T311/2 -> T311-2 for easier robust matching? 
    // The API returns 'M228', 'M26/4'. 
    // gov_data has codes in 'stop.code' (if I added it) or 'stop.raw.P_ALIAS'/'ALIAS'.
    
    // We will iterate routes, fetch stops, and find matches in 'stopsOriginal'.
    
    // Get list of routes to scan
    // User mentioned 22 and 33. We can start with a curated list or try all.
    // Scanning ALL ~90 routes might take a minute. That's fine.
    // Let's manually extract route list from src/data/routes.js (it requires import, let's just regex read it or hardcode)
    
    // Extract routes from file content if require fails (due to ES6 export)
    let routeList = ['33', '22', '25', '26A', '25B', 'MT4', '102X', 'AP1', '1', '3', '10', '21A']; 
    // Expand this list? 
    // List is just export const ALL_ROUTES = [ "1", "1A", ... ];
    const routesFile = fs.readFileSync('src/data/routes.ts', 'utf8');
    const matches = routesFile.match(/"([0-9A-Z]+)"/g);
    if (matches) {
        routeList = [...new Set(matches.map(m => m.replace(/"/g, '')))];
    }
    console.log(`Found ${routeList.length} routes to scan.`);

    let validCoordsCount = 0;
    
    for (const route of routeList) {
        process.stdout.write(`Scanning Route ${route}... `);
        
        // Fetch Dir 0 and Dir 1
        const stops0 = await fetchMapLocation(route, '0');
        const stops1 = await fetchMapLocation(route, '1');
        const allStops = [...stops0, ...stops1];
        
        if (allStops.length === 0) { console.log("(No data)"); continue; }
        
        // Update
        let checks = 0;
        allStops.forEach(apiStop => {
            const apiCode = apiStop.stationCode; // e.g. "M228" or "M26/4"
            const apiLat = parseFloat(apiStop.latitude);
            const apiLon = parseFloat(apiStop.longitude);
            
            if (!apiCode || isNaN(apiLat)) return;

            // Find in gov_data
            // Match logic: 
            // 1. Exact 'code' property
            // 2. 'raw.P_ALIAS' (e.g. M26_4) vs 'M26/4' -> replace / with _ or vice versa
            // 3. 'raw.ALIAS' (M26) vs 'M26/4' -> Loose match? No, precise is better.
            
            const normalizedApi = apiCode.replace('/', '_');
            
            stopsOriginal.forEach(localStop => {
                const localCode = localStop.code || localStop.raw?.P_ALIAS; 
                const localAlias = localStop.raw?.ALIAS; // Base station code like "T304"
                if (!localCode) return;
                
                // Match conditions:
                // 1. Exact match: T304 === T304
                // 2. Normalized match: T304/1 -> T304_1 === T304_1
                // 3. Base code match: API "T304" matches local "T304_1" (P_ALIAS starts with API code)
                // 4. ALIAS match: Local ALIAS "T304" === API "T304"
                const exactMatch = localCode === apiCode || localCode === normalizedApi;
                const baseMatch = localCode.startsWith(apiCode + '_') || localCode.startsWith(apiCode + '/');
                const aliasMatch = localAlias === apiCode;
                
                if (exactMatch || baseMatch || aliasMatch) {
                    // Check if different (tolerance 0.000001)
                    if (Math.abs(localStop.lat - apiLat) > 0.000001 || Math.abs(localStop.lon - apiLon) > 0.000001) {
                         // Update!
                         localStop.lat = apiLat;
                         localStop.lon = apiLon;
                         localStop.updated = true; // Flag for debug
                         validCoordsCount++;
                    }
                }
            });
            checks++;
        });
        console.log(`Checked ${checks} stops. Total Updates: ${validCoordsCount}`);
        
        // Rate limit slightly
        await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`Writing updated data to src/data/gov_data.json... (${validCoordsCount} coordinates updated)`);
    fs.writeFileSync('src/data/gov_data.json', JSON.stringify(rawData, null, 2));
    console.log("Done.");

})();
