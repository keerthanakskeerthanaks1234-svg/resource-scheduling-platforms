const router = require("express").Router();
const { executeTask, requestResource, getMyTasks, getTaskById } = require("../controllers/taskController");
const { authRequired, requireRole } = require("../middleware/authMiddleware");

router.post("/execute", authRequired, requireRole("buyer"), executeTask);
router.post("/request", authRequired, requireRole("buyer"), requestResource);
router.get("/mine", authRequired, requireRole("buyer"), getMyTasks);
router.get("/:id", authRequired, requireRole("buyer"), getTaskById);

module.exports = router;
