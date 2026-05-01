const router = require("express").Router();
const { registerNode, listNodes, getNodeStats } = require("../controllers/nodeController");
const { authRequired, requireRole } = require("../middleware/authMiddleware");

router.post("/register", registerNode);
router.get("/list", authRequired, requireRole("admin"), listNodes);
router.get("/stats", authRequired, requireRole("admin"), getNodeStats);

module.exports = router;
