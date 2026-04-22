const router = require("express").Router();
const { protect } = require("../middleware/auth");
const { getProfile, updateProfile, updateLocation } = require("../controllers/userController");

// GET /api/user/profile
router.get("/profile", protect, getProfile);

// PUT /api/user/profile
router.put("/profile", protect, updateProfile);

// PUT /api/user/location
router.put("/location", protect, updateLocation);

module.exports = router;
