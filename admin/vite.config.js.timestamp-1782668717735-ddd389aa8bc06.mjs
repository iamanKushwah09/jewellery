// vite.config.js
import react from "file:///C:/Users/Shivani%20Sharma/Desktop/New-Ecommerce/admin/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig } from "file:///C:/Users/Shivani%20Sharma/Desktop/New-Ecommerce/admin/node_modules/vite/dist/node/index.js";
import cssInjectedByJsPlugin from "file:///C:/Users/Shivani%20Sharma/Desktop/New-Ecommerce/admin/node_modules/vite-plugin-css-injected-by-js/dist/esm/index.js";
import { VitePWA } from "file:///C:/Users/Shivani%20Sharma/Desktop/New-Ecommerce/admin/node_modules/vite-plugin-pwa/dist/index.js";
import compression from "file:///C:/Users/Shivani%20Sharma/Desktop/New-Ecommerce/admin/node_modules/vite-plugin-compression2/dist/index.mjs";
import dns from "dns";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\Shivani Sharma\\Desktop\\New-Ecommerce\\admin";
dns.setDefaultResultOrder("verbatim");
var vite_config_default = defineConfig({
  // root: "./", // Set the root directory of your project
  // base: "/", // Set the base URL path for your application
  build: {
    // outDir: "build", // Set the output directory for the build files
    assetsDir: "@/assets",
    // Set the directory for the static assets
    // sourcemap: process.env.__DEV__ === "true",
    rollupOptions: {
      // Additional Rollup configuration options if needed
    },
    chunkSizeWarningLimit: 10 * 1024
  },
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        // enabled: process.env.SW_DEV === "true",
        enabled: false,
        /* when using generateSW the PWA plugin will switch to classic */
        type: "module",
        navigateFallback: "index.html"
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024
      },
      // add this to cache all the
      // // static assets in the public folder
      // includeAssets: ["**/*"],
      includeAssets: [
        "src/assets/img/logo/*.png",
        "src/assets/img/*.png",
        "src/assets/img/*.jepg",
        "src/assets/img/*.webp",
        "favicon.ico"
      ],
      manifest: {
        theme_color: "#FFFFFF",
        background_color: "#FFFFFF",
        display: "standalone",
        orientation: "portrait",
        scope: ".",
        start_url: ".",
        id: ".",
        short_name: "Dashtar - E-Commerce Website",
        name: "Dashtar : React eCommerce Admin Dashboard",
        description: "Dashtar : React Grocery & Organic Food Store e-commerce Admin Dashboard",
        icons: [
          {
            src: "favicon.ico",
            sizes: "48x48",
            type: "image/x-icon"
          },
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/icon-256x256.png",
            sizes: "256x256",
            type: "image/png"
          },
          {
            src: "/icon-384x384.png",
            sizes: "384x384",
            type: "image/png"
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    }),
    compression()
  ],
  server: {
    proxy: {
      "/api/": {
        target: "http://192.168.1.35:5055",
        changeOrigin: true
      }
    }
  },
  define: {
    "process.env": process.env
    // global: {}, //enable this when running on dev/local mode
  },
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      "@": path.resolve(__vite_injected_original_dirname, "./src/")
    }
  },
  test: {
    global: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTest.js"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTaGl2YW5pIFNoYXJtYVxcXFxEZXNrdG9wXFxcXE5ldy1FY29tbWVyY2VcXFxcYWRtaW5cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFNoaXZhbmkgU2hhcm1hXFxcXERlc2t0b3BcXFxcTmV3LUVjb21tZXJjZVxcXFxhZG1pblxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvU2hpdmFuaSUyMFNoYXJtYS9EZXNrdG9wL05ldy1FY29tbWVyY2UvYWRtaW4vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCBjc3NJbmplY3RlZEJ5SnNQbHVnaW4gZnJvbSBcInZpdGUtcGx1Z2luLWNzcy1pbmplY3RlZC1ieS1qc1wiO1xyXG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSBcInZpdGUtcGx1Z2luLXB3YVwiO1xyXG5pbXBvcnQgY29tcHJlc3Npb24gZnJvbSBcInZpdGUtcGx1Z2luLWNvbXByZXNzaW9uMlwiO1xyXG5cclxuaW1wb3J0IGRucyBmcm9tIFwiZG5zXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcblxyXG5kbnMuc2V0RGVmYXVsdFJlc3VsdE9yZGVyKFwidmVyYmF0aW1cIik7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIC8vIHJvb3Q6IFwiLi9cIiwgLy8gU2V0IHRoZSByb290IGRpcmVjdG9yeSBvZiB5b3VyIHByb2plY3RcclxuICAvLyBiYXNlOiBcIi9cIiwgLy8gU2V0IHRoZSBiYXNlIFVSTCBwYXRoIGZvciB5b3VyIGFwcGxpY2F0aW9uXHJcblxyXG4gIGJ1aWxkOiB7XHJcbiAgICAvLyBvdXREaXI6IFwiYnVpbGRcIiwgLy8gU2V0IHRoZSBvdXRwdXQgZGlyZWN0b3J5IGZvciB0aGUgYnVpbGQgZmlsZXNcclxuICAgIGFzc2V0c0RpcjogXCJAL2Fzc2V0c1wiLCAvLyBTZXQgdGhlIGRpcmVjdG9yeSBmb3IgdGhlIHN0YXRpYyBhc3NldHNcclxuICAgIC8vIHNvdXJjZW1hcDogcHJvY2Vzcy5lbnYuX19ERVZfXyA9PT0gXCJ0cnVlXCIsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIC8vIEFkZGl0aW9uYWwgUm9sbHVwIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBpZiBuZWVkZWRcclxuICAgIH0sXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwICogMTAyNCxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBjc3NJbmplY3RlZEJ5SnNQbHVnaW4oKSxcclxuXHJcbiAgICBWaXRlUFdBKHtcclxuICAgICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIixcclxuICAgICAgZGV2T3B0aW9uczoge1xyXG4gICAgICAgIC8vIGVuYWJsZWQ6IHByb2Nlc3MuZW52LlNXX0RFViA9PT0gXCJ0cnVlXCIsXHJcbiAgICAgICAgZW5hYmxlZDogZmFsc2UsXHJcbiAgICAgICAgLyogd2hlbiB1c2luZyBnZW5lcmF0ZVNXIHRoZSBQV0EgcGx1Z2luIHdpbGwgc3dpdGNoIHRvIGNsYXNzaWMgKi9cclxuICAgICAgICB0eXBlOiBcIm1vZHVsZVwiLFxyXG4gICAgICAgIG5hdmlnYXRlRmFsbGJhY2s6IFwiaW5kZXguaHRtbFwiLFxyXG4gICAgICB9LFxyXG4gICAgICB3b3JrYm94OiB7XHJcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbXCIqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Z31cIl0sXHJcbiAgICAgICAgbWF4aW11bUZpbGVTaXplVG9DYWNoZUluQnl0ZXM6IDEwICogMTAyNCAqIDEwMjQsXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIGFkZCB0aGlzIHRvIGNhY2hlIGFsbCB0aGVcclxuICAgICAgLy8gLy8gc3RhdGljIGFzc2V0cyBpbiB0aGUgcHVibGljIGZvbGRlclxyXG4gICAgICAvLyBpbmNsdWRlQXNzZXRzOiBbXCIqKi8qXCJdLFxyXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbXHJcbiAgICAgICAgXCJzcmMvYXNzZXRzL2ltZy9sb2dvLyoucG5nXCIsXHJcbiAgICAgICAgXCJzcmMvYXNzZXRzL2ltZy8qLnBuZ1wiLFxyXG4gICAgICAgIFwic3JjL2Fzc2V0cy9pbWcvKi5qZXBnXCIsXHJcbiAgICAgICAgXCJzcmMvYXNzZXRzL2ltZy8qLndlYnBcIixcclxuICAgICAgICBcImZhdmljb24uaWNvXCIsXHJcbiAgICAgIF0sXHJcbiAgICAgIG1hbmlmZXN0OiB7XHJcbiAgICAgICAgdGhlbWVfY29sb3I6IFwiI0ZGRkZGRlwiLFxyXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6IFwiI0ZGRkZGRlwiLFxyXG4gICAgICAgIGRpc3BsYXk6IFwic3RhbmRhbG9uZVwiLFxyXG4gICAgICAgIG9yaWVudGF0aW9uOiBcInBvcnRyYWl0XCIsXHJcbiAgICAgICAgc2NvcGU6IFwiLlwiLFxyXG4gICAgICAgIHN0YXJ0X3VybDogXCIuXCIsXHJcbiAgICAgICAgaWQ6IFwiLlwiLFxyXG4gICAgICAgIHNob3J0X25hbWU6IFwiRGFzaHRhciAtIEUtQ29tbWVyY2UgV2Vic2l0ZVwiLFxyXG4gICAgICAgIG5hbWU6IFwiRGFzaHRhciA6IFJlYWN0IGVDb21tZXJjZSBBZG1pbiBEYXNoYm9hcmRcIixcclxuICAgICAgICBkZXNjcmlwdGlvbjpcclxuICAgICAgICAgIFwiRGFzaHRhciA6IFJlYWN0IEdyb2NlcnkgJiBPcmdhbmljIEZvb2QgU3RvcmUgZS1jb21tZXJjZSBBZG1pbiBEYXNoYm9hcmRcIixcclxuICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6IFwiZmF2aWNvbi5pY29cIixcclxuICAgICAgICAgICAgc2l6ZXM6IFwiNDh4NDhcIixcclxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS94LWljb25cIixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogXCIvaWNvbi0xOTJ4MTkyLnBuZ1wiLFxyXG4gICAgICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAgICAgICAgIHB1cnBvc2U6IFwibWFza2FibGVcIixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogXCIvaWNvbi0yNTZ4MjU2LnBuZ1wiLFxyXG4gICAgICAgICAgICBzaXplczogXCIyNTZ4MjU2XCIsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6IFwiL2ljb24tMzg0eDM4NC5wbmdcIixcclxuICAgICAgICAgICAgc2l6ZXM6IFwiMzg0eDM4NFwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiBcIi9pY29uLTUxMng1MTIucG5nXCIsXHJcbiAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcclxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gICAgY29tcHJlc3Npb24oKSxcclxuICBdLFxyXG5cclxuICBzZXJ2ZXI6IHtcclxuICAgIHByb3h5OiB7XHJcbiAgICAgIFwiL2FwaS9cIjoge1xyXG4gICAgICAgIHRhcmdldDogXCJodHRwOi8vMTkyLjE2OC4xLjM1OjUwNTVcIixcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgZGVmaW5lOiB7XHJcbiAgICBcInByb2Nlc3MuZW52XCI6IHByb2Nlc3MuZW52LFxyXG4gICAgLy8gZ2xvYmFsOiB7fSwgLy9lbmFibGUgdGhpcyB3aGVuIHJ1bm5pbmcgb24gZGV2L2xvY2FsIG1vZGVcclxuICB9LFxyXG5cclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmMvXCIpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHRlc3Q6IHtcclxuICAgIGdsb2JhbDogdHJ1ZSxcclxuICAgIGVudmlyb25tZW50OiBcImpzZG9tXCIsXHJcbiAgICBzZXR1cEZpbGVzOiBbXCIuL3NyYy9zZXR1cFRlc3QuanNcIl0sXHJcbiAgfSxcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVYsT0FBTyxXQUFXO0FBQzNXLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sMkJBQTJCO0FBQ2xDLFNBQVMsZUFBZTtBQUN4QixPQUFPLGlCQUFpQjtBQUV4QixPQUFPLFNBQVM7QUFDaEIsT0FBTyxVQUFVO0FBUGpCLElBQU0sbUNBQW1DO0FBU3pDLElBQUksc0JBQXNCLFVBQVU7QUFFcEMsSUFBTyxzQkFBUSxhQUFhO0FBQUE7QUFBQTtBQUFBLEVBSTFCLE9BQU87QUFBQTtBQUFBLElBRUwsV0FBVztBQUFBO0FBQUE7QUFBQSxJQUVYLGVBQWU7QUFBQTtBQUFBLElBRWY7QUFBQSxJQUNBLHVCQUF1QixLQUFLO0FBQUEsRUFDOUI7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLHNCQUFzQjtBQUFBLElBRXRCLFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLFlBQVk7QUFBQTtBQUFBLFFBRVYsU0FBUztBQUFBO0FBQUEsUUFFVCxNQUFNO0FBQUEsUUFDTixrQkFBa0I7QUFBQSxNQUNwQjtBQUFBLE1BQ0EsU0FBUztBQUFBLFFBQ1AsY0FBYyxDQUFDLGdDQUFnQztBQUFBLFFBQy9DLCtCQUErQixLQUFLLE9BQU87QUFBQSxNQUM3QztBQUFBO0FBQUE7QUFBQTtBQUFBLE1BSUEsZUFBZTtBQUFBLFFBQ2I7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsVUFBVTtBQUFBLFFBQ1IsYUFBYTtBQUFBLFFBQ2Isa0JBQWtCO0FBQUEsUUFDbEIsU0FBUztBQUFBLFFBQ1QsYUFBYTtBQUFBLFFBQ2IsT0FBTztBQUFBLFFBQ1AsV0FBVztBQUFBLFFBQ1gsSUFBSTtBQUFBLFFBQ0osWUFBWTtBQUFBLFFBQ1osTUFBTTtBQUFBLFFBQ04sYUFDRTtBQUFBLFFBQ0YsT0FBTztBQUFBLFVBQ0w7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFlBQ04sU0FBUztBQUFBLFVBQ1g7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsWUFBWTtBQUFBLEVBQ2Q7QUFBQSxFQUVBLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFNBQVM7QUFBQSxRQUNQLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixlQUFlLFFBQVE7QUFBQTtBQUFBLEVBRXpCO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUE7QUFBQSxNQUVMLEtBQUssS0FBSyxRQUFRLGtDQUFXLFFBQVE7QUFBQSxJQUN2QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxJQUNiLFlBQVksQ0FBQyxvQkFBb0I7QUFBQSxFQUNuQztBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
