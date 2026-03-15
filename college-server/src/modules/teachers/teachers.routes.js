// Teachers routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const asyncHandler = require("../../utils/asyncHandler");
const { getMyProfile } = require("./teachers.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

router.get("/me", authMiddleware, requireRole(["teacher", "hod"]), asyncHandler(getMyProfile));

module.exports = router;

