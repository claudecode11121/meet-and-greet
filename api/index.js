import app from '../server.js';

export default function handler(req, res) {
  // If Vercel rewrote /api/... to /api, restore the original incoming path so Express routes match
  if (req.originalUrl && req.originalUrl.startsWith('/api') && !req.url.startsWith('/api')) {
    req.url = req.originalUrl;
  }
  return app(req, res);
}
