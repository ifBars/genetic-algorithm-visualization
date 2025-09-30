import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoBase = '/genetic-algorithm-visualization/';

const isCI = typeof process !== 'undefined' && process.env?.GITHUB_ACTIONS;

export default defineConfig({
  base: isCI ? repoBase : '/',
  plugins: [react()],
});
