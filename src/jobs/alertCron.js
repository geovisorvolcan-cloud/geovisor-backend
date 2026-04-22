const cron = require("node-cron");
const VolcanBulletin = require("../models/VolcanBulletin");
const { scrapeBulletin, getISOWeekKey } = require("../services/alertScraper");

async function runScrape() {
  const weekKey = getISOWeekKey(new Date());
  const existing = await VolcanBulletin.findOne({ weekKey });
  if (existing) {
    console.log(`[alertCron] Bulletin for ${weekKey} already exists — skipping.`);
    return;
  }

  console.log(`[alertCron] Scraping SGC bulletin for week ${weekKey}...`);
  try {
    const data = await scrapeBulletin();
    await VolcanBulletin.create(data);
    console.log(`[alertCron] Saved bulletin: ${data.alertLevel} — ${data.alertText.slice(0, 80)}...`);
  } catch (err) {
    console.error(`[alertCron] Scrape failed: ${err.message}`);
  }
}

function startAlertCron() {
  // Colombia is UTC-5 (no DST). Tuesdays at 22:00 COT = Wednesday 03:00 UTC
  cron.schedule("0 3 * * 3", runScrape, { timezone: "UTC" });

  // Fallback: Tuesday midnight COT (Wed 00:00 COT) = Wednesday 05:00 UTC
  cron.schedule("0 5 * * 3", runScrape, { timezone: "UTC" });

  console.log("[alertCron] Scheduled: Tuesdays 22:00 COT and 00:00 COT (Wed 03:00 / 05:00 UTC)");
}

module.exports = { startAlertCron };
