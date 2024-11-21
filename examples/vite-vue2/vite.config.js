import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import template from 'vite-plugin-zip-dist';

export default defineConfig({
  plugins: [createVuePlugin(), template()],
});
