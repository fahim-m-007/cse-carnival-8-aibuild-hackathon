import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/apiRoutes.js';
import { handleAgentChat } from './agent/agentController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root and server
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);
app.post('/api/agent/chat', handleAgentChat);

// Serve Frontend Static Files (from client/dist)
const clientDist = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // Helpful landing page if dist has not been built yet
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CampusOS API Server</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0B0F19; color: #F8FAFC; text-align: center; }
          .card { background: #131B2E; border: 1px solid #00873D; border-radius: 12px; padding: 2.5rem; max-width: 500px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h2 { color: #4ADE80; margin-top: 0; }
          a.btn { display: inline-block; background: #00873D; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 15px; }
          a.btn:hover { background: #00682E; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>CampusOS Backend is Running!</h2>
          <p>The interactive frontend development server is running at:</p>
          <a class="btn" href="http://localhost:5173">Open CampusOS Dashboard (Port 5173)</a>
          <p style="margin-top: 20px; font-size: 0.85rem; color: #94A3B8;">API Health: <a href="/api/health" style="color: #4ADE80;">/api/health</a></p>
        </div>
      </body>
      </html>
    `);
  });
}

// Initialize DB and launch server
async function startServer() {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` CampusOS Server running on port ${PORT}`);
    console.log(` Dashboard UI: http://localhost:${PORT}`);
    console.log(` Health: http://localhost:${PORT}/api/health`);
    console.log(` Live SSE: http://localhost:${PORT}/api/events/live`);
    console.log(`=========================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[Server Error] Port ${PORT} is already in use by another running process.`);
      console.error(`Please stop the previous instance or run: npx kill-port ${PORT}\n`);
      process.exit(1);
    } else {
      console.error('[Server Error]:', err);
    }
  });
}

startServer();
