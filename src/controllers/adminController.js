const User = require("../models/User");
const DataPoint = require("../models/DataPoint");
const { getRecentSosAlerts } = require("./sosController");

const DATA_POINT_TYPES = new Set([
  "social",
  "sgi_geo",
  "sgi_magnetometry",
  "sgi_gravimetry",
  "gidco",
  "uis_geophysics",
  "mt_acquisition",
]);

function serializeDataPoint(point) {
  return {
    id: point.pointId,
    position: point.position,
    type: point.type,
    label: point.label,
    description: point.description,
    acquired: point.acquired,
    createdAt: point.createdAt,
  };
}

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

// POST /api/admin/data-points - create a data point in MongoDB
const createDataPoint = async (req, res) => {
  const { pointId, type, position, label, description, acquired } = req.body;
  const normalizedPointId = String(pointId || "").trim();
  const normalizedLabel = String(label || normalizedPointId).trim();
  const normalizedDescription = String(description || "").trim();

  if (!normalizedPointId) {
    return res.status(400).json({ error: "pointId is required." });
  }
  if (!DATA_POINT_TYPES.has(type)) {
    return res.status(400).json({ error: "Invalid data point type." });
  }
  if (
    !Array.isArray(position) ||
    position.length !== 2 ||
    position.some((value) => typeof value !== "number" || !Number.isFinite(value)) ||
    position[0] < -90 ||
    position[0] > 90 ||
    position[1] < -180 ||
    position[1] > 180
  ) {
    return res.status(400).json({ error: "position must be [latitude, longitude]." });
  }
  if (acquired !== undefined && typeof acquired !== "boolean") {
    return res.status(400).json({ error: "acquired must be a boolean." });
  }

  try {
    const point = await DataPoint.create({
      pointId: normalizedPointId,
      type,
      position,
      label: normalizedLabel || undefined,
      description: normalizedDescription || undefined,
      acquired: acquired ?? false,
    });

    res.status(201).json(serializeDataPoint(point));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "A data point with this ID already exists." });
    }
    console.error("createDataPoint error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

// PATCH /api/admin/data-points/:pointId/acquired - update only acquisition status
const updateDataPointAcquired = async (req, res) => {
  const { acquired } = req.body;
  if (typeof acquired !== "boolean") {
    return res.status(400).json({ error: "acquired must be a boolean." });
  }

  try {
    const point = await DataPoint.findOneAndUpdate(
      { pointId: req.params.pointId },
      { $set: { acquired } },
      { new: true, runValidators: true }
    ).select("pointId acquired");

    if (!point) return res.status(404).json({ error: "Data point not found." });
    res.json({ id: point.pointId, acquired: point.acquired });
  } catch (err) {
    console.error("updateDataPointAcquired error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = { getUsers, updateUserRole, createDataPoint, updateDataPointAcquired, getRecentSosAlerts };
