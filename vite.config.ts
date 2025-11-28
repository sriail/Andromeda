import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@titaniumnetwork-dev/ultraviolet/dist/!(uv.config.js)',
          dest: 'uv'
        },
        {
          src: 'node_modules/@mercuryworkshop/bare-mux/dist/*',
          dest: 'baremux'
        },
        {
          src: 'node_modules/@mercuryworkshop/epoxy-transport/dist/*',
          dest: 'epoxy'
        },
        {
          src: 'node_modules/@mercuryworkshop/libcurl-transport/dist/*',
          dest: 'libcurl'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist/public',
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/wisp': {
        target: 'ws://localhost:8080',
        ws: true
      },
      '/bare': {
        target: 'http://localhost:8080'
      }
    }
  }
});
