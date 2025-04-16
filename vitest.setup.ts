import dotenv from 'dotenv';

// Load environment variables from .env.local specifically for tests
dotenv.config({ path: '.env.local' });

// You can add other global test setup here if needed
// For example, configuring jsdom further, setting up mocks, etc.

console.log('Vitest setup: Loaded environment variables.'); // Add log for confirmation
