import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    // Disable source maps in production for security and smaller bundle size
    sourcemap: false,
    // Optimize chunk size for Chromebooks (target <500KB per chunk)
    chunkSizeWarningLimit: 500,
    // Enable minification (esbuild is faster than terser and built-in)
    minify: 'esbuild',
    // Note: To use terser for more aggressive minification, install it:
    // npm install --save-dev terser
    // Then set minify: 'terser' with terserOptions
    rollupOptions: {
      output: {
        // Optimized chunking strategy for Chromebooks
        manualChunks: (id) => {
          // Vendor chunks for large dependencies
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase';
          }
          // i18n in separate chunk (not needed immediately)
          if (id.includes('node_modules/i18next')) {
            return 'vendor-i18n';
          }
          // Code-split the claims database (large data file ~375KB)
          if (id.includes('src/data/claims.js')) {
            return 'claims';
          }
          // Teacher dashboard in separate chunk (only loaded in teacher mode)
          if (id.includes('src/components/TeacherDashboard')) {
            return 'teacher';
          }
          // Leaderboard components in separate chunk
          if (id.includes('src/components/Leaderboard') || id.includes('src/components/ScrollingLeaderboard')) {
            return 'leaderboard';
          }
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/img/[name]-[hash][extname]`;
          } else if (/woff2?|ttf|otf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
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
