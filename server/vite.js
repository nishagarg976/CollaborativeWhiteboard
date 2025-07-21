import express from "express";
import { createServer } from "vite";

export function setupVite(app, server) {
  if (process.env.NODE_ENV === "production") {
    app.use(express.static("dist/public"));
    return Promise.resolve();
  } else {
    return createServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: "client",
      logLevel: process.env.NODE_ENV === "development" ? "info" : "error",
    }).then((vite) => {
      app.use(vite.ssrFixStacktrace);
      app.use(vite.middlewares);
      return vite;
    });
  }
}