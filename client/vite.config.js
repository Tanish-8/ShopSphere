import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  server: {
    port: 5173,
    fs: {
      allow: [
        resolve(__dirname),
        resolve(__dirname, '..')
      ]
    }
  }
});
