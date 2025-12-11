import axios from 'axios';
import md5 from 'js-md5';
import https from 'https';

const generateDsatToken = (params) => {
  let queryString = "";
  Object.keys(params).forEach((key, index) => {
      queryString += (index === 0 ? "" : "&") + key + "=" + params[key];
  });
  
  const dirtyHash = md5(queryString);
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

async function testLocation(routeCode, dir) {
  console.log(`\nTesting Location API (routestation/location): Code=${routeCode}, Dir=${dir}`);
  
  const params = {
      routeCode: routeCode,
      dir: dir,
      device: 'web',
      lang: 'zh-tw',
      date: new Date().getTime() // Try adding timestamp
  };
  
  const token = generateDsatToken(params);
  const body = new URLSearchParams(params).toString();

  try {
    const response = await axios.post('https://bis.dsat.gov.mo:37812/macauweb/routestation/location', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://bis.dsat.gov.mo:37812/macauweb/',
        'token': token
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    console.log("Status:", response.status);
    console.log("Full Response Data:", JSON.stringify(response.data).substring(0, 2000));

  } catch (error) {
    console.error("Location Request Failed:", error.message);
  }
}

async function testRealtimeBus(routeCode, dir) {
  // Captured: action=dy&routeName=N2&dir=0&lang=zh-tw&routeType=0&device=web
  console.log(`\nTesting Realtime Bus API (routestation/bus): Code=${routeCode}, Dir=${dir} (Captured Params)`);
  
  // Note: routeCode in our var is "N2" which matches "routeName" in captured.
  // BUT keys must be in order? md5 might not care about URLSearchParams order if we stringify manually?
  // generateDsatToken uses Object.keys(params).
  // I will create object in EXACT order of captured string to be safe.
  
  const params = {
      action: 'dy',
      routeName: routeCode, // e.g. "N2"
      dir: dir,
      lang: 'zh-tw',
      routeType: '0',
      device: 'web'
  };
  
  const token = generateDsatToken(params);
  const body = new URLSearchParams(params).toString(); // Standard implementation may reorder?
  // Let's rely on standard map behavior for now or verify generation.

  try {
    const response = await axios.post('https://bis.dsat.gov.mo:37812/macauweb/routestation/bus', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://bis.dsat.gov.mo:37812/macauweb/',
        'token': token
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    console.log("Status:", response.status);
    console.log("Full Response Data:", JSON.stringify(response.data).substring(0, 2000));

  } catch (error) {
    console.error("Realtime Request Failed:", error.message);
  }
}

async function testBusMess(routeNo, dir) {
  console.log(`\nTesting BusMess (ddbus/busmess/route): Route=${routeNo}, Dir=${dir}`);
  
  const params = {
      action: "search",
      device: "web",
      // HUID? Maybe optional or generated? Let's leave it out or empty.
      lang: "zh-tw",
      routeName: routeNo,
      dir: dir,
      BypassToken: "HuatuTesting0307"
  };
  
  const token = generateDsatToken(params);
  const body = new URLSearchParams(params).toString();

  try {
    const response = await axios.post('https://bis.dsat.gov.mo:37812/macauweb/ddbus/busmess/route', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://bis.dsat.gov.mo:37812/macauweb/',
        'token': token
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    console.log("Status:", response.status);
    console.log("Full Response Data:", JSON.stringify(response.data).substring(0, 2000));

  } catch (error) {
    console.error("BusMess Request Failed:", error.message);
    if (error.response) console.error("Data:", error.response.data);
  }
}

async function run() {
    await testRealtimeBus("N2", "0");
    await testRealtimeBus("N2", "1");
}

run();
