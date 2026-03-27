import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import env from "./config/env.js";
import app from "./app.js";
import { initializeIndexes } from "./utils/initializeDb.js";
import { gracefulShutdown, stopMetricsMonitoring } from "./config/db.js";
import logger from "./config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

let server;

server = app.listen(env.PORT, async () => {
  logger.info(`🚀 Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);

  // Initialize database indexes on startup (production only)
  await initializeIndexes();
});

// Graceful shutdown — stop metrics, drain connections, close pool
const shutdown = async (signal) => {
  logger.info(`${signal} received — initiating graceful shutdown`);

  // Step 1: Stop accepting new requests
  if (server) {
    server.close(async () => {
      logger.info("Server stopped accepting connections");

      // Step 2: Drain DB pool and close
      try {
        await gracefulShutdown();
        logger.info("Graceful shutdown complete");
        process.exit(0);
      } catch (error) {
        logger.error("Error during shutdown", { message: error.message });
        process.exit(1);
      }
    });
  }

  // Force exit after 30 seconds if graceful shutdown hangs
  setTimeout(() => {
    logger.error("Graceful shutdown timeout — forcing exit");
    process.exit(1);
  }, 30000);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Catch unhandled rejections so the process doesn't silently swallow errors
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection", {
    reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason,
    promise: promise.toString ? promise.toString() : String(promise)
  });
  // Don't exit - let Express error handler deal with it if possible
});

// Catch uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", { message: error.message, stack: error.stack });
  process.exit(1);
});
