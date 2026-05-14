import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// TanStack Start 1.x Vite integration
export default defineConfig({
  plugins: [
    tanstackStart({
      server: {
        entry: "src/server.ts",
      },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
