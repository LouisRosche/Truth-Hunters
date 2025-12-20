import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    // Disable source maps in production for security and smaller bundle size
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React
          'vendor-react': ['react', 'react-dom'],
          // Firebase in its own chunk (large dependency)
          'vendor-firebase': ['firebase/app', 'firebase/firestore'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
        'cms/',
        'vite.config.js',
        'vite.cms.config.js',
      ],
    },
  },
});
