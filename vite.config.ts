import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 750,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          const path = id.replaceAll('\\', '/');
          if (path.includes('/node_modules/three/')) return 'three';
          if (path.includes('/node_modules/gsap/')) return 'motion';
        },
      },
    },
  },
});
