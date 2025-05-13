import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current directory.
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
                "@core": path.resolve(__dirname, "./src/core"),
            },
        },
        build: {
            outDir: 'dist', // Matches Capacitor's webDir in capacitor.config.ts
        },
        // Define environment variables for platform-specific builds
        define: {
            'process.env.PLATFORM': JSON.stringify(env.PLATFORM || 'web'),
            'process.env.MODE': JSON.stringify(mode),
        }
    };
});
