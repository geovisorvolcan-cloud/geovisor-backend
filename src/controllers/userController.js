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

// PUT /api/user/location  (protected) — lightweight position-only update
const updateLocation = async (req, res) => {
  const { position } = req.body;

  // position must be [lat, lng] or null to clear
  if (position !== null && position !== undefined) {
    if (!Array.isArray(position) || position.length !== 2 || position.some((v) => typeof v !== "number")) {
      return res.status(400).json({ error: "position must be [lat, lng] or null." });
    }
  }

  try {
    await User.findByIdAndUpdate(req.user._id, { position: position ?? undefined });
    res.json({ ok: true });
  } catch (err) {
    console.error("Update location error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = { getProfile, updateProfile, updateLocation };
