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
        '@styles': new URL('./src/styles', import.meta.url).pathname,
        '@scripts': new URL('./src/scripts', import.meta.url).pathname,
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          // Falls später SCSS verwendet werden soll
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
            
            const info = assetInfo.name.split('.');
            let extType = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              extType = 'images';
            } else if (/css/i.test(extType)) {
              extType = 'css';
            } else if (/js/i.test(extType)) {
              extType = 'js';
            }
            return `assets/${extType}/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        }
      }
    }
  }
});
