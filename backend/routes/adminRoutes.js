const router = require("express").Router();
const {
  getDashboard, getAllNodes, disableNode, enableNode, markNodeOffline,
  getAllUsers, blockUser, deleteUser, changeUserRole,
  getAllTasks, cancelTask, retryTask,
  getLogs, getAnalytics, getAlerts,
} = require("../controllers/adminController");
const { authRequired, requireRole } = require("../middleware/authMiddleware");

const admin = [authRequired, requireRole("admin")];

router.get("/dashboard", ...admin, getDashboard);
router.get("/analytics", ...admin, getAnalytics);
router.get("/alerts", ...admin, getAlerts);

router.get("/nodes", ...admin, getAllNodes);
router.post("/node/disable", ...admin, disableNode);
router.post("/node/enable", ...admin, enableNode);
router.post("/node/offline", ...admin, markNodeOffline);

router.get("/users", ...admin, getAllUsers);
router.post("/user/block", ...admin, blockUser);
router.delete("/user/:id", ...admin, deleteUser);
router.put("/user/role", ...admin, changeUserRole);

router.get("/tasks", ...admin, getAllTasks);
router.post("/task/cancel", ...admin, cancelTask);
router.post("/task/retry", ...admin, retryTask);

router.get("/logs", ...admin, getLogs);

module.exports = router;
