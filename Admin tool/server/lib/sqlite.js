const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(
  __dirname,
  '..',
  process.env.CLASSROOM_DB_PATH || '../../teacher/classroom-ai-main/backend/classroomai.db'
);

let db = null;

function getDb() {
  if (db) return db;

  if (!fs.existsSync(dbPath)) {
    console.warn(`SQLite database not found at ${dbPath} - teacher data will be unavailable`);
    return null;
  }

  try {
    db = new Database(dbPath, { readonly: true });
    console.log(`Connected to SQLite database at ${dbPath}`);
    return db;
  } catch (err) {
    console.error('Failed to open SQLite database:', err.message);
    return null;
  }
}

module.exports = { getDb };
