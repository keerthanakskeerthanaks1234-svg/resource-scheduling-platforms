const router = require("express").Router();
const {
  shareResource,
  getMyResources,
  getAvailableResources,
} = require("../controllers/resourceController");
const { authRequired, requireRole } = require("../middleware/authMiddleware");

router.post("/share", authRequired, requireRole("seller"), shareResource);
router.get("/mine", authRequired, requireRole("seller"), getMyResources);
router.get("/available", authRequired, getAvailableResources);

module.exports = router;

