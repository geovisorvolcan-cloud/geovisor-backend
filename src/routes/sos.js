const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { sendSos, getSosAlerts } = require("../controllers/sosController");

// POST /api/sos
router.post("/", protect, sendSos);

// GET /api/sos
router.get("/", protect, getSosAlerts);

module.exports = router;
