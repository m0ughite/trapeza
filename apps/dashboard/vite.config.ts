import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dashboardApiPlugin } from "./vite-plugin-dashboard-api";

export default defineConfig({
  plugins: [react(), dashboardApiPlugin()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
