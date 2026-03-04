const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Load & validate all environment variables BEFORE anything else
const env = require("./config/env");

const app = require("./app");

app.listen(env.PORT, () => {
  console.log(
    `🚀 Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`
  );
});

// Graceful shutdown — close DB pool and exit cleanly
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully`);
  const pool = require("./config/db");
  pool.end().then(() => {
    console.log("Database pool closed");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Catch unhandled rejections so the process doesn't silently swallow errors
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});
