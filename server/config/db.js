import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_DIR = path.resolve(__dirname, '../../data');
const STORAGE_DIR = path.resolve(__dirname, '../data_storage');

let isMongoActive = false;
const sseClients = new Set();

// Broadcast event to connected SSE clients
export function broadcastDataChange(type, payload = {}) {
  const message = `event: data_updated\ndata: ${JSON.stringify({ type, payload, timestamp: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

export function registerSSEClient(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('event: connected\ndata: "CampusOS Real-Time SSE Active"\n\n');
  sseClients.add(res);
  res.on('close', () => {
    sseClients.delete(res);
  });
}

// In-Memory & Disk Persistence Layer
class PersistentFileStore {
  constructor() {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    this.cache = {};
    this.collections = ['schedules', 'rooms', 'events', 'announcements', 'assignments'];
  }

  getFilePath(name) {
    return path.join(STORAGE_DIR, `${name}.json`);
  }

  getSeedFilePath(name) {
    return path.join(SEED_DIR, `${name}.json`);
  }

  init() {
    for (const name of this.collections) {
      const filePath = this.getFilePath(name);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          this.cache[name] = JSON.parse(content);
        } catch (e) {
          this.loadFromSeed(name);
        }
      } else {
        this.loadFromSeed(name);
      }
    }
    console.log('[Store] Persistent storage initialized for all 5 systems.');
  }

  loadFromSeed(name) {
    const seedPath = this.getSeedFilePath(name);
    if (fs.existsSync(seedPath)) {
      const data = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      this.cache[name] = data;
      this.save(name);
    } else {
      this.cache[name] = [];
    }
  }

  save(name) {
    try {
      fs.writeFileSync(this.getFilePath(name), JSON.stringify(this.cache[name], null, 2), 'utf-8');
    } catch (err) {
      console.error(`[Store] Error writing ${name}.json:`, err);
    }
  }

  resetAll() {
    for (const name of this.collections) {
      this.loadFromSeed(name);
    }
    broadcastDataChange('all', { action: 'reset' });
  }

  getAll(name) {
    return this.cache[name] || [];
  }

  getById(name, id) {
    const list = this.getAll(name);
    return list.find(item => item.id === id || item.room_number === id);
  }

  insert(name, item) {
    const list = this.getAll(name);
    list.unshift(item);
    this.save(name);
    broadcastDataChange(name, { action: 'insert', item });
    return item;
  }

  update(name, id, updates) {
    const list = this.getAll(name);
    const idx = list.findIndex(item => item.id === id || item.room_number === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.save(name);
      broadcastDataChange(name, { action: 'update', item: list[idx] });
      return list[idx];
    }
    return null;
  }

  delete(name, id) {
    const list = this.getAll(name);
    const idx = list.findIndex(item => item.id === id || item.room_number === id);
    if (idx !== -1) {
      const removed = list.splice(idx, 1)[0];
      this.save(name);
      broadcastDataChange(name, { action: 'delete', id });
      return removed;
    }
    return null;
  }
}

export const store = new PersistentFileStore();

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      console.log('[DB] Connecting to MongoDB at', mongoUri.replace(/:([^:@]{3,})@/, ':***@'));
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
      isMongoActive = true;
      console.log('[DB] MongoDB connected successfully.');
      return;
    } catch (err) {
      console.warn('[DB] MongoDB connection failed:', err.message);
    }
  }

  console.log('[DB] Running in zero-config mode: Persistent File Store enabled (persists to server/data_storage/).');
  store.init();
}
