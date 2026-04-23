const User = require("../models/User");

// PUT /api/user/name  (protected)
const updateName = async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true }
    ).select("-password");
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error("Update name error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

// PUT /api/user/password  (protected)
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword and newPassword are required." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters." });
  }
  try {
    const user = await User.findById(req.user._id);
    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }
    user.password = newPassword;
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

// DELETE /api/user/account  (protected)
const deleteAccount = async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password confirmation is required." });
  }
  try {
    const user = await User.findById(req.user._id);
    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: "Password is incorrect." });
    }
    await User.findByIdAndDelete(req.user._id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

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

module.exports = { getProfile, updateProfile, updateLocation, updateName, changePassword, deleteAccount };
