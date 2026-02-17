// Routes for auth endpoints only; delegates logic to controllers.
// Must NOT contain business logic, SQL, or auth verification.
const router = require("express").Router();
const { login, me, registerTeacher, registerStudent } = require("./auth.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.post("/login", login);
router.get("/me", authMiddleware, me);
router.post("/register/teacher", registerTeacher);
router.post("/register/student", registerStudent);

module.exports = router;
