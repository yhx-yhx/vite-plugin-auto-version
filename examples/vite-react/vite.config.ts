import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import template from 'vite-plugin-zip-dist';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), template()],
});
