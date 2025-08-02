// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  
  // Verbesserte Entwicklererfahrung
  devToolbar: {
    enabled: true
  },
  
  // Vite-Konfiguration für bessere Performance
  vite: {
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
        '@components': new URL('./src/components', import.meta.url).pathname,
        '@services': new URL('./src/services', import.meta.url).pathname,
        '@utils': new URL('./src/utils', import.meta.url).pathname,
        '@lib': new URL('./src/lib', import.meta.url).pathname,
        '@types': new URL('./src/types', import.meta.url).pathname,
      }
    }
  }
});
