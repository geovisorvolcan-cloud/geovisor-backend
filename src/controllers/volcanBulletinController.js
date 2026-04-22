const VolcanBulletin = require("../models/VolcanBulletin");
const { scrapeBulletin, getISOWeekKey } = require("../services/alertScraper");

const getLatest = async (req, res) => {
  try {
    const bulletin = await VolcanBulletin.findOne().sort({ scrapedAt: -1 });
    if (!bulletin) return res.json(null);
    res.json(bulletin);
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
};

// Admin-only: trigger a manual scrape
const triggerScrape = async (req, res) => {
  try {
    const weekKey = getISOWeekKey(new Date());
    const existing = await VolcanBulletin.findOne({ weekKey });
    if (existing) {
      return res.json({ ok: true, created: false, bulletin: existing });
    }

    const data = await scrapeBulletin();
    const bulletin = await VolcanBulletin.create(data);
    res.json({ ok: true, created: true, bulletin });
  } catch (err) {
    console.error("[volcanBulletin] manual scrape error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getLatest, triggerScrape };
