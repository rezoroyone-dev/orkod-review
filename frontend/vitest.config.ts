import vue from '@vitejs/plugin-vue';
import path from 'path';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

// Get the directory of this config file (always resolves to pranichealingfrontend)
const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: configDir,
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    vuetify({
      autoImport: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(configDir, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  ssr: {
    noExternal: ['vuetify', 'vuetify/**/*'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      path.resolve(configDir, 'src/setupTests.ts'),
      path.resolve(configDir, 'src/tests/authSetup.ts')
    ],
    include: ['src/tests/**/*.test.{ts,tsx,js,jsx}'],
    css: true,
    // Allow requests to localhost for integration tests
    server: {
      deps: {
        inline: ['axios'],
      },
    },
    // Increase timeout for integration tests that make API calls
    testTimeout: 120000,
    hookTimeout: 120000,
  },
});
