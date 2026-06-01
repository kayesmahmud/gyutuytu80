import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      // Resolve the workspace package to its TS source; the tests mock it anyway.
      '@thulobazaar/database': path.resolve(__dirname, '../database/src'),
    },
  },
});
