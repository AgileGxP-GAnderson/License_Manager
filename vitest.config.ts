import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'], // Keep this for per-file setup like dotenv
    globalSetup: ['./vitest.global-setup.ts'], // Add global setup file for DB sync
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    // Ensure tests run sequentially if DB state matters between tests within a file
    // poolOptions: { threads: { singleThread: true } }, // Or use --pool=threads --poolOptions.threads.singleThread=true CLI flag
    // Alternatively, use test.sequential in the test file itself
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
