// Departments routes: maps HTTP endpoints to controller functions.
// Public endpoint — used by registration forms to show department dropdown.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const { listDepartments } = require("./departments.controller");

// GET /api/departments — no auth required (needed for registration forms)
router.get("/", listDepartments);

module.exports = router;

