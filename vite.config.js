import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    open: true,
  },

  build: {
    rollupOptions: {
      output: {
        // three.js dwarfs the app code and changes far less
        // often, so give it its own long-lived chunk.
        manualChunks: {
          three: ["three"],
          animation: ["gsap"],
        },
      },
    },
  },
});
