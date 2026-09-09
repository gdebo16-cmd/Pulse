import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { statusesRouter } from './routes/statuses.js';
import { requireAuth } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3001;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const clientDist = path.join(__dirname, '../../client/dist');

app.use(
  cors({
    origin: clientOrigin === '*' ? true : clientOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/statuses', requireAuth, statusesRouter);

if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(port, () => {
  console.log(`Pulse API listening on http://localhost:${port}`);
  if (existsSync(clientDist)) {
    console.log(`Serving UI from ${clientDist}`);
  }
});
