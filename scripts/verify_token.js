import md5 from 'js-md5';

function generateDsatToken(params) {
    // 1. Construct Query String
    // Mimic Object.keys(t).map(...) logic.
    // Assuming simple key-value pairs.
    let queryString = "";
    Object.keys(params).forEach((key, index) => {
        queryString += (index === 0 ? "" : "&") + key + "=" + params[key];
    });

    console.log("Query String:", queryString);

    // 2. MD5 Hash
    const dirtyHash = md5(queryString);
    console.log("MD5 Hash:", dirtyHash);

    // 3. Time components
    // Logic: o = format("YYYYMMDDHHmm")
    const date = new Date();
    
    // Note: We need Macau time (or client time if trusted). 
    // Ensuring padding.
    const pad = (n) => n.toString().padStart(2, '0');
    const YYYY = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const DD = pad(date.getDate());
    const HH = pad(date.getHours());
    const mm = pad(date.getMinutes());
    
    const timeStr = `${YYYY}${MM}${DD}${HH}${mm}`;
    console.log("Time String:", timeStr);

    // 4. Splice Logic
    // r.splice(24, 0, o.slice(8)) -> insert min at 24
    // r.splice(12, 0, o.slice(4, 8)) -> insert DDHH at 12
    // r.splice(4, 0, o.slice(0, 4)) -> insert YYYYMM at 4
    
    let arr = dirtyHash.split("");
    
    const part3 = timeStr.slice(8);      // mm (2 chars? wait. YYYYMMDDHHmm is 12 chars. 8..12 is 4 chars? No.)
    // format("YYYYMMDDHHmm") -> 12 chars.
    // slice(8) -> index 8 to end. 8,9,10,11. -> HHmm?
    // 0123 4567 8901
    // YYYY MMDD HHmm
    // slice(8) is HHmm (4 chars).
    
    const part2 = timeStr.slice(4, 8);   // MMDD (4 chars)
    const part1 = timeStr.slice(0, 4);   // YYYY (4 chars)
    
    // Reverse splicing order to maintain indices? 
    // The instructions were: 
    // r.splice(24,0,...) 
    // r.splice(12,0,...)
    // r.splice(4,0,...)
    // These are sequential operations on the *growing* array.
    
    arr.splice(24, 0, part3);
    arr.splice(12, 0, part2);
    arr.splice(4, 0, part1);
    
    return arr.join("");
}

// Test Case
const params = { RouteNo: "33" };
try {
    const token = generateDsatToken(params);
    console.log("Generated Token:", token);
} catch (e) {
    console.error(e);
}
