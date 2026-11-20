import vue from "@vitejs/plugin-vue";
import { defineConfig, type ProxyOptions } from "vite";

const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:3000";
const proxy: Record<string, ProxyOptions> = {
  "/api": { target: backend },
  "/health": { target: backend },
};

export default defineConfig({
  root: "web",
  envDir: process.cwd(),
  plugins: [vue()],
  server: {
    host: process.env.HOST ?? "127.0.0.1",
    port: Number(process.env.PORT ?? 8080),
    proxy,
  },
  preview: {
    host: process.env.HOST ?? "127.0.0.1",
    port: Number(process.env.PORT ?? 8080),
    proxy,
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
