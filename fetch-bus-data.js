#!/usr/bin/env node
/**
 * Macau Bus Network Data Fetcher & Transformer (API Scraping Version)
 * 
 * Scrapes bus route data directly from the Macau DSAT API (per route),
 * aggregates the data, and transforms it into a graph-structure JSON.
 * 
 * Usage: node fetch-bus-data.js
 * Output: public/bus_data.json
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import md5 from 'js-md5';

// Helper for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = 'https://bis.dsat.gov.mo:37812/macauweb/getRouteData.html';
const OUTPUT_PATH = path.resolve(__dirname, './public/bus_data.json');
const REQUEST_DELAY_MS = 200; // Delay between requests to be polite

// Full list of routes to scrape (from src/data/routes.ts)
const ALL_ROUTES = [
  "1", "1A", "2", "2A", "2AS", "3", "3A", "3AX", "3X", "4", "5", "5X", 
  "6A", "6B", "7", "8", "8A", "9", "9A", "10", "10B", "11", "12", "15", 
  "15S", "15S1", "16", "16S", "17", "17S", "18", "18A", "18B", "19", 
  "21A", "22", "23", "25", "25AX", "25B", "25BS", "26", "26A", "27", 
  "28A", "28B", "28C", "29", "30", "30X", "32", "33", "34", "35", "36", 
  "37", "39", "50", "50B", "51", "51A", "51X", "52", "55", "56", "59", 
  "60", "61", "65", "71", "71S", "72", "73", "101X", "102X", "103", 
  "701X", "701XS", "AP1", "AP1X", "H1", "H2", "H3", "MT1", "MT2", 
  "MT3", "MT4", "MT5", "N1A", "N1B", "N2", "N3", "N5", "N6"
];

/**
 * Generate DSAT API Token (Reverse engineered)
 */
function generateDsatToken(params) {
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
}

/**
 * Fetch data for a single route and direction
 */
async function fetchRouteData(routeName, dir) {
    const params = {
        routeName,
        dir,
        lang: 'zh-tw',
        device: 'web'
    };
    
    const token = generateDsatToken(params);
    const qs = new URLSearchParams(params).toString();
    
    try {
        const response = await axios.post(BASE_URL, qs, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'token': token,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });
        
        return response.data;
    } catch (error) {
        console.error(`❌ Failed to fetch Route ${routeName} (Dir ${dir}): ${error.message}`);
        return null;
    }
}

/**
 * Transform API response to our graph structure
 */
function processRouteData(graphData, routeName, dir, apiData) {
    if (!apiData || !apiData.data || !apiData.data.routeInfo) {
        return;
    }

    const { stops, routes } = graphData;
    const routeInfo = apiData.data.routeInfo;
    
    if (routeInfo.length === 0) return;

    const direction = String(dir);
    const routeKey = `${routeName}_${direction}`;
    
    // Initialize route
    if (!routes[routeKey]) {
        routes[routeKey] = {
            id: routeKey,
            baseRoute: routeName,
            direction: direction,
            stops: []
        };
    }
    
    // Process stops
    routeInfo.forEach((stop, index) => {
        const stopId = stop.staCode;
        const stopName = stop.staName;
        
        if (!stopId) return;

        // Add/update stop
        if (!stops[stopId]) {
            stops[stopId] = {
                id: stopId,
                name: stopName,
                routes: []
            };
        }
        
        // Add route to stop's list
        if (!stops[stopId].routes.includes(routeKey)) {
            stops[stopId].routes.push(routeKey);
        }
        
        // Add stop to route's list (in order)
        routes[routeKey].stops.push(stopId);
    });
    
    console.log(`   ✅ Processed Route ${routeName} Dir ${direction}: ${routeInfo.length} stops`);
}

/**
 * Utility: Sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main execution
 */
async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('       Macau Bus Data Scraper (DSAT API)           ');
    console.log(`       Target Routes: ${ALL_ROUTES.length}                 `);
    console.log('═══════════════════════════════════════════════════\n');
    
    const graphData = {
        stops: {},
        routes: {}
    };
    
    let processedCount = 0;
    
    for (const routeName of ALL_ROUTES) {
        process.stdout.write(`🔄 Fetching Route ${routeName.padEnd(5)} `);
        
        // Fetch Direction 0
        const dataDir0 = await fetchRouteData(routeName, '0');
        processRouteData(graphData, routeName, '0', dataDir0);
        await sleep(REQUEST_DELAY_MS);
        
        // Fetch Direction 1
        // Note: Some circular routes might technically only have dir 0, 
        // but checking dir 1 is safer to ensure we get everything if it exists.
        // API returns empty or error if invalid usually.
        const dataDir1 = await fetchRouteData(routeName, '1');
        if (dataDir1 && dataDir1.data && dataDir1.data.routeInfo && dataDir1.data.routeInfo.length > 0) {
            processRouteData(graphData, routeName, '1', dataDir1);
        }
        
        processedCount++;
        await sleep(REQUEST_DELAY_MS); // Extra delay between routes
    }
    
    // Final Metadata
    const output = {
        _meta: {
            generatedAt: new Date().toISOString(),
            source: BASE_URL,
            stopCount: Object.keys(graphData.stops).length,
            routeCount: Object.keys(graphData.routes).length
        },
        ...graphData
    };
    
    // Save
    // Ensure directory exists
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log(`✅ SUCCESS! Scraped ${processedCount} routes.`);
    console.log(`   Stops: ${output._meta.stopCount}`);
    console.log(`   Route Directions: ${output._meta.routeCount}`);
    console.log(`   Saved to: ${OUTPUT_PATH}`);
    console.log('═══════════════════════════════════════════════════\n');
}

main();
