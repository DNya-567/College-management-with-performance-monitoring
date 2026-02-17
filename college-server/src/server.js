const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

console.log("JWT_SECRET at boot:", process.env.JWT_SECRET);

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
