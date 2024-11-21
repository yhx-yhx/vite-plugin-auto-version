/*
 * @Author: yhx 2045399856@qq.com
 * @Date: 2024-11-07 12:10:10
 * @LastEditTime: 2024-11-21 23:22:44
 * @FilePath: \vite-plugin-auto-version\examples\vite-vue3\vite.config.ts
 * @Description:
 *
 */
import vue from '@vitejs/plugin-vue';
import * as path from 'path';
import { defineConfig } from 'vite';
import template from '../../dist/index';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [vue(), template()],
  server: {
    port: 8080,
    hmr: {
      host: 'localhost',
      port: 8080,
    },
    proxy: {
      '/api': {
        target: 'your https address',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
    },
  },
});
