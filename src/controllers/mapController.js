const DataPoint = require("../models/DataPoint");
const Volcano = require("../models/Volcano");
const Campaign = require("../models/Campaign");
const User = require("../models/User");

// GET /api/map/data-points
const getDataPoints = async (req, res) => {
  try {
    const points = await DataPoint.find().select("-__v");
    res.json(
      points.map((p) => ({
        id: p.pointId,
        position: p.position,
        type: p.type,
        label: p.label,
        description: p.description,
      }))
    );
  } catch (err) {
    console.error("Get data-points error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

// GET /api/map/participants
const getParticipants = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ["field", "office"] } }).select(
      "name role position status location updatedAt"
    );

    res.json(
      users.map((u) => {
        const elapsed = Date.now() - new Date(u.updatedAt).getTime();
        const totalSec = Math.floor(elapsed / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60)
          .toString()
          .padStart(2, "0");
        const s = (totalSec % 60).toString().padStart(2, "0");

        return {
          name: u.name,
          role: u.role,
          position: u.position,
          status: u.status === "Active" ? "active" : "inactive",
          lastUpdate: `${h}:${m}:${s}`,
          location: u.location,
        };
      })
    );
  } catch (err) {
    console.error("Get participants error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

// GET /api/map/volcano
const getVolcano = async (req, res) => {
  try {
    const volcano = await Volcano.findOne().sort({ createdAt: -1 });
    if (!volcano) {
      return res.status(404).json({ error: "No volcano data found." });
    }
    res.json({
      name: volcano.name,
      position: volcano.position,
      alertLevel: volcano.alertLevel,
      description: volcano.description,
      lastUpdated: volcano.lastUpdated,
    });
  } catch (err) {
    console.error("Get volcano error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

// GET /api/map/campaigns
const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ order: 1 }).select("-__v");
    res.json(
      campaigns.map((c) => ({
        label: c.label,
        current: c.current,
        total: c.total,
        color: c.color,
      }))
    );
  } catch (err) {
    console.error("Get campaigns error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = { getDataPoints, getParticipants, getVolcano, getCampaigns };
