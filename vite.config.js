import { defineConfig } from "vite";
import restart from "vite-plugin-restart";
import { resolve } from "path";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  root: "src/",
  publicDir: "../static/",
  base: "./",
  server: {
    host: true, // Open to local network and display URL
    open: !("SANDBOX_URL" in process.env || "CODESANDBOX_HOST" in process.env), // Open if it's not a CodeSandbox
  },
  build: {
    outDir: "../dist", // Output in the dist/ folder
    emptyOutDir: true, // Empty the folder first
    sourcemap: true, // Add sourcemap,
    rollupOptions: {
      input: {
        main: "./src/index.html",
        example2: "./src/example2/index.html",
      },
    },
  },
  plugins: [
    restart({ restart: ["../static/**"] }), // Restart server on static file change
    glsl(), // Handle shader files
  ],
});
