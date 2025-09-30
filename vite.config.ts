import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoBase = '/genetic-algorithm-visualization/';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? repoBase : '/',
  plugins: [react()],
});
