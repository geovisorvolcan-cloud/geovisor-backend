const { validationResult } = require("express-validator");
const StatusUpdate = require("../models/StatusUpdate");

// POST /api/status  (protected)
const createStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const update = await StatusUpdate.create({
      user: req.user._id,
      text: req.body.text,
    });

    res.status(201).json({
      id: update._id,
      text: update.text,
      createdAt: update.createdAt,
    });
  } catch (err) {
    console.error("Create status error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

// GET /api/status  (protected) — returns the authenticated user's last 20 updates
const getStatus = async (req, res) => {
  try {
    const updates = await StatusUpdate.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("-user -__v");

    res.json(updates);
  } catch (err) {
    console.error("Get status error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = { createStatus, getStatus };
