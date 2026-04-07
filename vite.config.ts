import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { federation } from '@module-federation/vite';
import { fileURLToPath } from 'url';

// IMPORTANT: Change 'mytool' to your tool's unique name
const TOOL_NAME = 'feature-forge';

const mfVirtualDir = fileURLToPath(
  new URL('./node_modules/__mf__virtual', import.meta.url)
);

export default defineConfig(({ command }) => ({
  css: {
    modules: {
      // Enable CSS Modules with scoped class names
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
  resolve: {
    alias: {
      __mf__virtual: mfVirtualDir,
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    // Only enable Module Federation for production builds —
    // in dev mode it breaks React's initialization order in shared modules
    ...(command === 'build'
      ? [
          federation({
            name: TOOL_NAME,
            filename: 'remoteEntry.js',
            exposes: {
              './Tool': './src/Tool.tsx',
            },
            shared: {
              react: {
                singleton: true,
                requiredVersion: '^19.0.0',
                strictVersion: false,
              },
              'react-dom': {
                singleton: true,
                requiredVersion: '^19.0.0',
                strictVersion: false,
              },
              '@tanstack/react-query': {
                singleton: true,
                strictVersion: false,
              },
              '@appmirror/ui-kit': {
                singleton: true,
                strictVersion: false,
              },
            },
          }),
        ]
      : []),
  ],
  build: {
    target: 'esnext',
    minify: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        minifyInternalExports: false,
      },
    },
  },
  server: {
    port: 5174,
    cors: true,
  },
  preview: {
    port: 4174,
    cors: true,
  },
}));
