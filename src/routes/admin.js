const express = require("express");
const router = express.Router();
const { getUsers, getDataPoints, updateUserRole, createDataPoint, updateDataPointAcquired, getRecentSosAlerts } = require("../controllers/adminController");
const { protect } = require("../middleware/auth");

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
};

router.get("/users", protect, requireAdmin, getUsers);
router.put("/users/:id/role", protect, requireAdmin, updateUserRole);
router.get("/data-points", protect, requireAdmin, getDataPoints);
router.post("/data-points", protect, requireAdmin, createDataPoint);
router.put("/data-points/:pointId", protect, requireAdmin, updateDataPointAcquired);
router.put("/data-points/:pointId/acquired", protect, requireAdmin, updateDataPointAcquired);
router.patch("/data-points/:pointId/acquired", protect, requireAdmin, updateDataPointAcquired);
router.get("/sos-alerts", protect, requireAdmin, getRecentSosAlerts);

module.exports = router;
