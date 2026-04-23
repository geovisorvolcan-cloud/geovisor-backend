const router = require("express").Router();
const { protect } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  updateLocation,
  updateName,
  changePassword,
  deleteAccount,
} = require("../controllers/userController");

// GET /api/user/profile
router.get("/profile", protect, getProfile);

// PUT /api/user/profile
router.put("/profile", protect, updateProfile);

// PUT /api/user/location
router.put("/location", protect, updateLocation);

// PUT /api/user/name
router.put("/name", protect, updateName);

// PUT /api/user/password
router.put("/password", protect, changePassword);

// DELETE /api/user/account
router.delete("/account", protect, deleteAccount);

module.exports = router;
