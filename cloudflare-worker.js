/**
 * Cloudflare Worker - CORS Proxy for Macau Bus API
 * 
 * Deploy this to your Cloudflare account (free):
 * 1. Go to https://dash.cloudflare.com/
 * 2. Workers & Pages > Create Application > Create Worker
 * 3. Replace the code with this file content
 * 4. Deploy and get your worker URL (e.g., macau-bus-proxy.yourname.workers.dev)
 * 5. Update api.ts to use your worker URL
 */

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Only allow Macau government API
    if (!targetUrl.startsWith('https://bis.dsat.gov.mo')) {
      return new Response('Only bis.dsat.gov.mo is allowed', { status: 403 });
    }

    try {
      // Clone request headers
      const headers = new Headers();
      request.headers.forEach((value, key) => {
        if (!['host', 'origin', 'referer'].includes(key.toLowerCase())) {
          headers.set(key, value);
        }
      });

      // Add required headers for Macau API
      headers.set('Referer', 'https://bis.dsat.gov.mo:37812/macauweb/map.html');
      headers.set('Origin', 'https://bis.dsat.gov.mo:37812');

      // Forward the request
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: request.method !== 'GET' ? await request.text() : undefined,
      });

      // Return with CORS headers
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', '*');

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response('Proxy error: ' + error, { status: 500 });
    }
  },
};
