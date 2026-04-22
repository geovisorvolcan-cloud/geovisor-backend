const express = require("express");
const router = express.Router();
const { getLatest, triggerScrape } = require("../controllers/volcanBulletinController");
const { protect, adminOnly } = require("../middleware/auth");

// Public: get latest bulletin
router.get("/latest", getLatest);

// Admin-only: manually trigger a scrape
router.post("/scrape", protect, adminOnly, triggerScrape);

module.exports = router;
