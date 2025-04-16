// vitest.global-setup.ts
import db from './lib/db'; // Adjust path if needed
import dotenv from 'dotenv';

// Load environment variables specifically for the global setup
dotenv.config({ path: '.env.local' });

console.log('Running Vitest global setup...');

export async function setup() {
  console.log('Syncing test database...');
  try {
    // WARNING: { force: true } will drop all tables! Only use on a test database.
    await db.sequelize.sync({ force: true });
    console.log('Test database synced successfully.');
  } catch (error) {
    console.error('Error syncing test database:', error);
    // Optionally throw error to prevent tests from running if DB setup fails
    // throw error;
  }
}

export async function teardown() {
  console.log('Running Vitest global teardown...');
  // Add any global cleanup logic here if needed, e.g., closing connections
  await db.sequelize.close();
  console.log('Database connection closed.');
}
