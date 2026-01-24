import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    root: __dirname,
    plugins: [react()],
    publicDir: resolve(__dirname, 'public'),
    build: {
        outDir: resolve(__dirname, '../dist-react'),
        emptyOutDir: true,
    },
    server: {
        port: 5173,
        host: true,
    },
    preview: {
        port: 4173,
    },
});
