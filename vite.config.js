import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // GitHub Pages 项目页部署在 /gerenzhan/ 子路径下；本地开发仍从根路径访问。
  base: command === "build" || isPreview ? "/gerenzhan/" : "/",
  server: {
    host: "127.0.0.1",
    port: 5173,
    open: false,
  },
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
  },
}));
