import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@huggingface/transformers') || id.includes('onnxruntime')) {
            return 'vendor-transformers';
          }
          if (id.includes('@radix-ui') || id.includes('lucide-react')) {
            return 'vendor-ui';
          }
          if (id.includes('recharts')) {
            return 'vendor-charts';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
}));
