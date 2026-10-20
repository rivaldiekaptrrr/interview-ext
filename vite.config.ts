import { defineConfig, build as viteBuild } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import fs from 'fs';

const rootDir = import.meta.dirname;

function chromeExtensionPlugin() {
  return {
    name: 'chrome-extension-plugin',
    async closeBundle() {
      // 1. Ensure dist/popup/popup.html
      const srcPopup = resolve(rootDir, 'dist/src/popup/popup.html');
      const popupDir = resolve(rootDir, 'dist/popup');
      const targetPopup = resolve(popupDir, 'popup.html');
      if (fs.existsSync(srcPopup)) {
        if (!fs.existsSync(popupDir)) {
          fs.mkdirSync(popupDir, { recursive: true });
        }
        fs.copyFileSync(srcPopup, targetPopup);
      }

      // 2. Ensure dist/demo/simulator.html
      const srcDemo = resolve(rootDir, 'dist/src/demo/simulator.html');
      const demoDir = resolve(rootDir, 'dist/demo');
      const targetDemo = resolve(demoDir, 'simulator.html');
      if (fs.existsSync(srcDemo)) {
        if (!fs.existsSync(demoDir)) {
          fs.mkdirSync(demoDir, { recursive: true });
        }
        fs.copyFileSync(srcDemo, targetDemo);
      }

      // 3. Build content script as a standalone IIFE bundle (No ES module imports allowed in Chrome content scripts)
      await viteBuild({
        configFile: false,
        resolve: {
          alias: {
            '@': resolve(rootDir, 'src'),
          },
        },
        build: {
          outDir: 'dist',
          emptyOutDir: false,
          minify: false,
          lib: {
            entry: resolve(rootDir, 'src/content/content.ts'),
            name: 'AIInterviewCopilotContent',
            formats: ['iife'],
            fileName: () => 'content/content.js',
          },
        },
      });
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), chromeExtensionPlugin()],
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    minify: false, // readable for debugging
    rollupOptions: {
      input: {
        popup: resolve(rootDir, 'src/popup/popup.html'),
        'service-worker': resolve(rootDir, 'src/background/service-worker.ts'),
        demo: resolve(rootDir, 'src/demo/simulator.html'),
      },
      output: {
        // Chrome extensions need predictable filenames (no hashes)
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'service-worker') return 'background/service-worker.js';
          if (chunkInfo.name === 'popup') return 'popup/popup.js';
          if (chunkInfo.name === 'demo') return 'demo/simulator.js';
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          const allNames = [assetInfo.name, ...(assetInfo.names || [])].filter(Boolean).join(' ');
          if (allNames.includes('.css')) {
            if (allNames.includes('popup')) return 'popup/popup.css';
            if (allNames.includes('demo') || allNames.includes('simulator')) return 'demo/simulator.css';
            return 'content/content.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
