import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

// Database initialization
// Store DB in /tmp when on Cloud Run to avoid read-only filesystem issues, 
// otherwise use project root or current directory
const isCloudRun = process.env.K_SERVICE !== undefined;
const dbPath = isCloudRun 
  ? '/tmp/database.db' 
  : path.resolve(process.cwd(), 'database.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON');

// Initialize schema
// In production (dist/), __dirname is server/dist/db, so we need to go up to find src
// Let's reliably find the schema.sql in server/src/db/schema.sql
let schemaPath = path.resolve(__dirname, 'schema.sql'); // if next to index.ts
if (!fs.existsSync(schemaPath)) {
  schemaPath = path.resolve(__dirname, '../../src/db/schema.sql'); // from dist/db to src/db
}
if (!fs.existsSync(schemaPath)) {
  schemaPath = path.resolve(process.cwd(), 'server/src/db/schema.sql'); // fallback
}

if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
} else {
  console.warn('Database schema.sql not found at any known location. Tried:', schemaPath);
}

export default db;
