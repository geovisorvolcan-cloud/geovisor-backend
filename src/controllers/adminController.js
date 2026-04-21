const User = require("../models/User");

// GET /api/admin/users — list all field/office users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ["field", "office"] } }).select("-password");
    res.json(
      users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        location: u.location,
        position: u.position,
      }))
    );
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

// PUT /api/admin/users/:id/role — change a user's role between field and office
const updateUserRole = async (req, res) => {
  const { role } = req.body;
  if (!["field", "office"].includes(role)) {
    return res.status(400).json({ error: "Role must be 'field' or 'office'." });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ id: user._id, name: user.name, role: user.role });
  } catch (err) {
    console.error("updateUserRole error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = { getUsers, updateUserRole };
