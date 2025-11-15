import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

const jsWithJsx = () => ({
  name: 'vite:load-js-as-jsx',
  enforce: 'pre',
  async transform(code, id) {
    const [filepath] = id.split('?');
    if (!filepath.endsWith('.js')) {
      return null;
    }

    return transformWithEsbuild(code, filepath, {
      loader: 'jsx',
      jsx: 'automatic',
    });
  },
});

export default defineConfig({
  plugins: [
    jsWithJsx(),
    svgr(),
    react({
      include: /\.(j|t)sx?$/,
    }),
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: /node_modules/,
    jsx: 'automatic',
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
      jsx: 'automatic',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
  },
});
