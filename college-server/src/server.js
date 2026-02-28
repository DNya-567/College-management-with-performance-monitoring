const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Verify JWT_SECRET is present (do NOT log the actual value)
if (!process.env.JWT_SECRET) {
  console.error("⚠️ JWT_SECRET is not set — auth will fail");
}

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Log memory usage once at startup for reference
const used = process.memoryUsage();
console.log("Startup memory (MB):", {
  rss: Math.round(used.rss / 1024 / 1024),
  heapUsed: Math.round(used.heapUsed / 1024 / 1024),
  heapTotal: Math.round(used.heapTotal / 1024 / 1024),
});

