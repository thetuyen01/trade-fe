import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Lắng nghe trên tất cả các IP
    port: 4000, // Cổng mà Vite sẽ chạy
  },
});
