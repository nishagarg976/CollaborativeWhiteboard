import express from "express";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Trust proxy for Replit environment
  app.set("trust proxy", true);

  const httpServer = await registerRoutes(app);

  // Setup Vite middleware
  await setupVite(app, httpServer);

  const PORT = parseInt(process.env.PORT || '5000', 10);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[express] serving on port ${PORT}`);
  });
}

startServer().catch(console.error);