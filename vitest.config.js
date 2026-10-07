import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    environmentMatchGlobs: [
      ['tests/**', 'jsdom']
    ],
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js']
  }
});
