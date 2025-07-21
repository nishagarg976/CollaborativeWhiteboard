import express from "express";
import { registerRoutes } from "./routes.js";
import { setupVite } from "./vite.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust proxy for Replit environment
app.set("trust proxy", true);

// Setup Vite middleware
await setupVite(app);

const httpServer = await registerRoutes(app);

const PORT = parseInt(process.env.PORT || '5000', 10);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[express] serving on port ${PORT}`);
});