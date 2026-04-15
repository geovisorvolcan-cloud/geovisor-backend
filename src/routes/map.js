const router = require("express").Router();
const {
  getDataPoints,
  getParticipants,
  getVolcano,
  getCampaigns,
} = require("../controllers/mapController");

// All map routes are public (no auth required — visible to unauthenticated users)
// GET /api/map/data-points
router.get("/data-points", getDataPoints);

// GET /api/map/participants
router.get("/participants", getParticipants);

// GET /api/map/volcano
router.get("/volcano", getVolcano);

// GET /api/map/campaigns
router.get("/campaigns", getCampaigns);

module.exports = router;
