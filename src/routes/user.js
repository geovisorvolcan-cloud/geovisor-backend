const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { getProfile, updateProfile } = require("../controllers/userController");

// GET /api/user/profile
router.get("/profile", protect, getProfile);

// PUT /api/user/profile
router.put("/profile", protect, updateProfile);

module.exports = router;
