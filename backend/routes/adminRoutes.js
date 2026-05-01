const router = require("express").Router();
const { getDashboard, getAllUsers, getAllTasks } = require("../controllers/adminController");
const { authRequired, requireRole } = require("../middleware/authMiddleware");

router.get("/dashboard", authRequired, requireRole("admin"), getDashboard);
router.get("/users", authRequired, requireRole("admin"), getAllUsers);
router.get("/tasks", authRequired, requireRole("admin"), getAllTasks);

module.exports = router;
