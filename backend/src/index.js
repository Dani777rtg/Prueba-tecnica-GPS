import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';
import { ensureAdminUser } from './services/authService.js';

const app = createApp();

async function start() {
  try {
    await pool.query('SELECT 1');
    await ensureAdminUser();

    const server = app.listen(config.port, () => {
      console.log(`Fleet GPS API listening on port ${config.port}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received — shutting down`);
      server.close(async () => {
        try {
          await pool.end();
        } finally {
          process.exit(0);
        }
      });
      setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
