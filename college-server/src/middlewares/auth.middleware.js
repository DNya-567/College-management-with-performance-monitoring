// Middleware responsible for verifying JWTs and checking active status.
// Performs a lightweight DB check to enforce account deactivation immediately.
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Check if user account is still active
    const result = await db.query(
      "SELECT is_active FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rowCount === 0 || result.rows[0].is_active === false) {
      return res.status(403).json({ message: "Account is deactivated." });
    }

    return next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    console.error("Auth middleware error:", err.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = authMiddleware;
