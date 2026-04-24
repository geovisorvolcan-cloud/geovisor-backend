const SosAlert = require("../models/SosAlert");
const { sendSosAlertEmail } = require("../services/sosNotifier");

// POST /api/sos  (protected)
const sendSos = async (req, res) => {
  try {
    const { position, message } = req.body;

    const alert = await SosAlert.create({
      user: req.user._id,
      position: position || req.user.position,
      message: message || "Emergency SOS triggered",
    });

    let emailResult = { sent: false, skipped: true, reason: "not_attempted" };
    try {
      emailResult = await sendSosAlertEmail({ alert, user: req.user });
    } catch (emailErr) {
      console.error("SOS email error:", emailErr);
      emailResult = { sent: false, skipped: false, reason: "send_failed" };
    }

    res.status(201).json({
      id: alert._id,
      sent: true,
      user: req.user.name,
      position: alert.position,
      message: alert.message,
      createdAt: alert.createdAt,
      emailSent: emailResult.sent,
      emailRecipient: emailResult.to || null,
      emailStatus: emailResult.reason || "sent",
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

// GET /api/sos/admin/recent  (admin) — recent alerts across all users
const getRecentSosAlerts = async (req, res) => {
  try {
    const alerts = await SosAlert.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("user", "name email role")
      .select("-__v");

    res.json(
      alerts.map((alert) => ({
        id: alert._id,
        user: alert.user
          ? {
              id: alert.user._id,
              name: alert.user.name,
              email: alert.user.email,
              role: alert.user.role,
            }
          : null,
        position: alert.position,
        message: alert.message,
        resolved: alert.resolved,
        createdAt: alert.createdAt,
      }))
    );
  } catch (err) {
    console.error("Get recent SOS alerts error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = { sendSos, getSosAlerts, getRecentSosAlerts };
