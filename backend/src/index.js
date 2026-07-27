import dotenv from 'dotenv';
import { createApp } from './app.js';
import { pool } from './db.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 3001;
const app = createApp();

async function start() {
  try {
    await pool.query('SELECT 1');
    app.listen(PORT, () => {
      console.log(`Fleet GPS API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server (database connection):', error.message);
    process.exit(1);
  }
}

start();
