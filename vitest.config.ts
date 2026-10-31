import { defineConfig } from "vitest/config";
import path from "path";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
      "~": path.resolve(__dirname, "./app"),
      "#shared": path.resolve(__dirname, "./shared"),
      "#server": path.resolve(__dirname, "./server"),
      "#app": path.resolve(__dirname, "./node_modules/nuxt/dist/app"),
      vue: path.resolve(
        __dirname,
        "./node_modules/.pnpm/vue@3.5.40_typescript@6.0.3/node_modules/vue",
      ),
    },
  },
});
