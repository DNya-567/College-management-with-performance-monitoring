// Role-based access control middleware
// Responsibility: allow only specified roles to access a route
// Must NOT query the database

module.exports = function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
