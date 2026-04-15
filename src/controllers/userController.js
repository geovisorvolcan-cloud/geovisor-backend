const User = require("../models/User");

// GET /api/user/profile  (protected)
const getProfile = async (req, res) => {
  // req.user is set by auth middleware
  const user = req.user;
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    location: user.location,
    volcanoAlert: user.volcanoAlert,
    position: user.position,
    updatedAt: user.updatedAt,
  });
};

// PUT /api/user/profile  (protected)
const updateProfile = async (req, res) => {
  const allowed = ["name", "status", "location", "position"];
  const updates = {};

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  try {
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      location: user.location,
      volcanoAlert: user.volcanoAlert,
      position: user.position,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = { getProfile, updateProfile };
