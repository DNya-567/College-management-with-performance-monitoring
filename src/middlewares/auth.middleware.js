// Middleware responsible for verifying JWTs and attaching user payload.
// Must NOT perform database queries or handle routing.
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = authMiddleware;
