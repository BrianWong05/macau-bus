import axios from 'axios';
import md5 from 'js-md5';

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

async function testHttpPost(routeNo) {
  console.log(`\nTesting HTTP POST: ${routeNo}`);
  const token = generateDsatToken({ RouteNo: routeNo });
  console.log(`Generated Token: ${token}`);
  
  const params = new URLSearchParams();
  params.append('Token', token);
  params.append('RouteNo', routeNo);

  try {
    const response = await axios.post('http://www.dsat.gov.mo/bresws/BusEnquiryServices.asmx/SearchRouteByBusNumber', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://bis.dsat.gov.mo/'
      },
    });

    console.log("Status:", response.status);
    console.log("Snippet:", response.data.substring(0, 500));

  } catch (error) {
    console.error("Request Failed:", error.message);
    if (error.response) console.error("Data:", error.response.data);
  }
}

async function run() {
    await testHttpPost("33");
    await testHttpPost("N2");
}

run();
