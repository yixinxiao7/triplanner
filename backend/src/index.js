import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { createServer as createHttpsServer } from 'https';
import app from './app.js';

const PORT = process.env.PORT || 3000;
const SSL_KEY = process.env.SSL_KEY_PATH;
const SSL_CERT = process.env.SSL_CERT_PATH;

if (SSL_KEY && SSL_CERT && existsSync(SSL_KEY) && existsSync(SSL_CERT)) {
  const httpsOptions = {
    key: readFileSync(SSL_KEY),
    cert: readFileSync(SSL_CERT),
  };
  createHttpsServer(httpsOptions, app).listen(PORT, () => {
    console.log(`HTTPS Server running on https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`HTTP Server running on http://localhost:${PORT}`);
  });
}
