const express = require("express");
const router = express.Router();
const { getUsers, updateUserRole, getRecentSosAlerts } = require("../controllers/adminController");
const { protect } = require("../middleware/auth");

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
};

router.get("/users", protect, requireAdmin, getUsers);
router.put("/users/:id/role", protect, requireAdmin, updateUserRole);
router.get("/sos-alerts", protect, requireAdmin, getRecentSosAlerts);

module.exports = router;
