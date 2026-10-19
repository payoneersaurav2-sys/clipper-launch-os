import http from 'http';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import handler from '../api/webhook/paddle';

const PORT = Number(process.env.PADDLE_WEBHOOK_PORT || 3001);

const server = http.createServer(async (req, res) => {
  const url = req.url || '';
  if ((url === '/api/webhook/paddle' || url.startsWith('/api/webhook/paddle?')) && req.method === 'POST') {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      const rawBody = Buffer.concat(chunks).toString('utf-8');
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }
      }

      const webReq = new Request(`http://localhost:${PORT}${url}`, {
        method: req.method,
        headers,
        body: rawBody,
      });

      console.log(`[paddle-listener] Incoming webhook: size=${rawBody.length} bytes, signature=${headers.get('paddle-signature')?.slice(0, 20)}...`);

      try {
        const webRes = await handler(webReq);
        res.statusCode = webRes.status;
        webRes.headers.forEach((val, key) => res.setHeader(key, val));
        const resBody = await webRes.text();
        res.end(resBody);
        console.log(`[paddle-listener] Response: ${webRes.status} ${resBody}`);
      } catch (err) {
        console.error('[paddle-listener] Execution error:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
  } else if (url === '/health' || url === '/') {
    res.statusCode = 200;
    res.end('Paddle webhook local dev listener running');
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`[paddle-listener] Ready on http://localhost:${PORT}/api/webhook/paddle`);
});
