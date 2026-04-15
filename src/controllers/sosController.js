const SosAlert = require("../models/SosAlert");

// POST /api/sos  (protected)
const sendSos = async (req, res) => {
  try {
    const { position, message } = req.body;

    const alert = await SosAlert.create({
      user: req.user._id,
      position: position || req.user.position,
      message: message || "Emergency SOS triggered",
    });

    // In a production app you would notify emergency contacts here
    // e.g. send emails/SMS via Twilio/SendGrid

    res.status(201).json({
      id: alert._id,
      sent: true,
      user: req.user.name,
      position: alert.position,
      message: alert.message,
      createdAt: alert.createdAt,
    });
  } catch (err) {
    console.error("SOS error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

// GET /api/sos  (protected) — recent alerts for the authenticated user
const getSosAlerts = async (req, res) => {
  try {
    const alerts = await SosAlert.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("-user -__v");

    res.json(alerts);
  } catch (err) {
    console.error("Get SOS error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = { sendSos, getSosAlerts };
