import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import https from 'https'

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'application/json, text/plain, */*', 'Accept-Language': 'en-US,en;q=0.9', 'Referer': 'https://finance.yahoo.com/', 'Origin': 'https://finance.yahoo.com' } }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch(e) { resolve({ status: res.statusCode, body: null }); } });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function stockApiDevPlugin() {
  return {
    name: 'stock-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/stock-data', (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { ticker } = JSON.parse(body);
            const symbol = (ticker || '').trim().toUpperCase();
            // Try quote API first
            let result = null;
            const q = await httpsGet(`https://query1.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(symbol)}&fields=regularMarketPrice,longName,shortName,currency,regularMarketChange,regularMarketChangePercent`);
            const quote = q.status === 200 && q.body?.quoteResponse?.result?.[0];
            if (quote && quote.regularMarketPrice != null) {
              result = { ticker: quote.symbol, name: quote.longName || quote.shortName || quote.symbol, currency: quote.currency || 'USD', price: quote.regularMarketPrice, change: quote.regularMarketChange ?? null, changePct: quote.regularMarketChangePercent ?? null };
            }
            // Fallback: chart API
            if (!result) {
              const c = await httpsGet(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`);
              const meta = c.status === 200 && c.body?.chart?.result?.[0]?.meta;
              if (meta && meta.regularMarketPrice != null) {
                const prev = meta.previousClose ?? meta.chartPreviousClose ?? meta.regularMarketPrice;
                result = { ticker: meta.symbol || symbol, name: meta.longName || meta.shortName || symbol, currency: meta.currency || 'USD', price: meta.regularMarketPrice, change: meta.regularMarketPrice - prev, changePct: prev ? ((meta.regularMarketPrice - prev) / prev) * 100 : null };
              }
            }
            if (!result) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Ticker not found' })); return; }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.ANTHROPIC_API_KEY || env.ANTHROPIC_KEY || '';
return {
  plugins: [
    react(),
    stockApiDevPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Abound',
        short_name: 'Abound',
        description: 'Your personal cash flow forecast',
        theme_color: '#09081a',
        background_color: '#09081a',
        display: 'standalone',
        orientation: 'landscape',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api/categorise': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: () => '/v1/messages',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('x-api-key', apiKey);
            proxyReq.setHeader('anthropic-version', '2023-06-01');
            proxyReq.removeHeader('anthropic-dangerous-direct-browser-access');
          });
        },
      },
    },
  },
}});

