// vite.config.ts
import { defineConfig } from "file:///Users/kanghyeon/DEV/cake-demo/node_modules/vite/dist/node/index.js";
import react from "file:///Users/kanghyeon/DEV/cake-demo/node_modules/@vitejs/plugin-react/dist/index.js";
import { viteStaticCopy } from "file:///Users/kanghyeon/DEV/cake-demo/node_modules/vite-plugin-static-copy/dist/index.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
var __vite_injected_original_import_meta_url = "file:///Users/kanghyeon/DEV/cake-demo/vite.config.ts";
var __dirname = path.dirname(fileURLToPath(new URL(".", __vite_injected_original_import_meta_url)));
var vite_config_default = defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "extension/manifest.json", dest: "." }
      ]
    })
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        sidepanel: "extension/sidepanel.html",
        background: "extension/background.ts",
        content: "extension/content.ts"
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "background") return "background.js";
          if (chunk.name === "content") return "content.js";
          return "assets/[name].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    },
    sourcemap: true,
    emptyOutDir: true
  },
  publicDir: false
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMva2FuZ2h5ZW9uL0RFVi9jYWtlLWRlbW9cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9rYW5naHllb24vREVWL2Nha2UtZGVtby92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMva2FuZ2h5ZW9uL0RFVi9jYWtlLWRlbW8vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHsgdml0ZVN0YXRpY0NvcHkgfSBmcm9tICd2aXRlLXBsdWdpbi1zdGF0aWMtY29weSdcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICdub2RlOnVybCdcbmltcG9ydCB0eXBlIHsgT3V0cHV0Q2h1bmsgfSBmcm9tICdyb2xsdXAnXG5cbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4nLCBpbXBvcnQubWV0YS51cmwpKSlcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgdml0ZVN0YXRpY0NvcHkoe1xuICAgICAgdGFyZ2V0czogW1xuICAgICAgICB7IHNyYzogJ2V4dGVuc2lvbi9tYW5pZmVzdC5qc29uJywgZGVzdDogJy4nIH1cbiAgICAgIF1cbiAgICB9KVxuICBdLFxuICBidWlsZDoge1xuICAgIG91dERpcjogJ2Rpc3QnLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGlucHV0OiB7XG4gICAgICAgIHNpZGVwYW5lbDogJ2V4dGVuc2lvbi9zaWRlcGFuZWwuaHRtbCcsXG4gICAgICAgIGJhY2tncm91bmQ6ICdleHRlbnNpb24vYmFja2dyb3VuZC50cycsXG4gICAgICAgIGNvbnRlbnQ6ICdleHRlbnNpb24vY29udGVudC50cycsXG4gICAgICB9LFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAoY2h1bmspID0+IHtcbiAgICAgICAgICBpZiAoY2h1bmsubmFtZSA9PT0gJ2JhY2tncm91bmQnKSByZXR1cm4gJ2JhY2tncm91bmQuanMnXG4gICAgICAgICAgaWYgKGNodW5rLm5hbWUgPT09ICdjb250ZW50JykgcmV0dXJuICdjb250ZW50LmpzJ1xuICAgICAgICAgIHJldHVybiAnYXNzZXRzL1tuYW1lXS5qcydcbiAgICAgICAgfSxcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nXG4gICAgICB9XG4gICAgfSxcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgZW1wdHlPdXREaXI6IHRydWVcbiAgfSxcbiAgcHVibGljRGlyOiBmYWxzZVxufSkgIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE0USxTQUFTLG9CQUFvQjtBQUN6UyxPQUFPLFdBQVc7QUFDbEIsU0FBUyxzQkFBc0I7QUFDL0IsT0FBTyxVQUFVO0FBQ2pCLFNBQVMscUJBQXFCO0FBSnNJLElBQU0sMkNBQTJDO0FBT3JOLElBQU0sWUFBWSxLQUFLLFFBQVEsY0FBYyxJQUFJLElBQUksS0FBSyx3Q0FBZSxDQUFDLENBQUM7QUFFM0UsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sZUFBZTtBQUFBLE1BQ2IsU0FBUztBQUFBLFFBQ1AsRUFBRSxLQUFLLDJCQUEyQixNQUFNLElBQUk7QUFBQSxNQUM5QztBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLFdBQVc7QUFBQSxRQUNYLFlBQVk7QUFBQSxRQUNaLFNBQVM7QUFBQSxNQUNYO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixnQkFBZ0IsQ0FBQyxVQUFVO0FBQ3pCLGNBQUksTUFBTSxTQUFTLGFBQWMsUUFBTztBQUN4QyxjQUFJLE1BQU0sU0FBUyxVQUFXLFFBQU87QUFDckMsaUJBQU87QUFBQSxRQUNUO0FBQUEsUUFDQSxnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFdBQVc7QUFBQSxJQUNYLGFBQWE7QUFBQSxFQUNmO0FBQUEsRUFDQSxXQUFXO0FBQ2IsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
