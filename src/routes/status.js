const router = require("express").Router();
const { body } = require("express-validator");
const { protect } = require("../middleware/auth");
const { createStatus, getStatus } = require("../controllers/statusController");

// POST /api/status
router.post(
  "/",
  protect,
  [body("text").notEmpty().withMessage("Status text is required.")],
  createStatus
);

// GET /api/status
router.get("/", protect, getStatus);

module.exports = router;
