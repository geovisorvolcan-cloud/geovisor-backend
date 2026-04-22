const axios = require("axios");
const cheerio = require("cheerio");
const pdfParse = require("pdf-parse");

const BASE_URL = "https://www2.sgc.gov.co";
const BULLETINS_PAGE =
  "https://www2.sgc.gov.co/sgc/volcanes/VolcanCerroMachin/Paginas/Boletines-Volcan-Cerro-Machin.aspx";

const LEVEL_KEYWORDS = {
  amarilla: "yellow",
  verde: "green",
  naranja: "orange",
  roja: "red",
};

function getISOWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // ISO week: Thursday determines the year
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function extractAlertFromText(text) {
  // Normalize whitespace
  const normalized = text.replace(/\s+/g, " ");

  // Look for "alerta <color>" pattern (case-insensitive)
  const levelMatch = normalized.match(/alerta\s+(Amarilla|Verde|Naranja|Roja)/i);
  if (!levelMatch) return null;

  const colorWord = levelMatch[1].toLowerCase();
  const alertLevel = LEVEL_KEYWORDS[colorWord];
  if (!alertLevel) return null;

  // Extract the full sentence containing the alert keyword
  // Try to get a span of text around the match
  const idx = normalized.search(/alerta\s+(Amarilla|Verde|Naranja|Roja)/i);
  // Find sentence start (go back up to 200 chars looking for ". " or start)
  let start = Math.max(0, idx - 200);
  const beforeChunk = normalized.substring(start, idx);
  const lastPeriod = beforeChunk.lastIndexOf(". ");
  if (lastPeriod !== -1) start = start + lastPeriod + 2;

  // Find sentence end (go forward up to 300 chars looking for ". ")
  let end = Math.min(normalized.length, idx + 300);
  const afterChunk = normalized.substring(idx, end);
  const nextPeriod = afterChunk.search(/\.\s/);
  if (nextPeriod !== -1) end = idx + nextPeriod + 1;

  const alertText = normalized.substring(start, end).trim();

  return { alertLevel, alertText: alertText || levelMatch[0] };
}

async function fetchLatestBulletinUrl() {
  const res = await axios.get(BULLETINS_PAGE, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; GeovisorBot/1.0)" },
    timeout: 30000,
  });
  const $ = cheerio.load(res.data);

  // Collect all anchor hrefs that look like bulletin links
  const candidates = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    if (
      /boletin|boletín/i.test(href) ||
      /boletin|boletín/i.test(text)
    ) {
      candidates.push({ href, text });
    }
  });

  if (!candidates.length) return null;

  // Prefer links with "semanal" in text or href (weekly bulletins)
  const weeklyCandidates = candidates.filter(
    (c) => /semanal/i.test(c.href) || /semanal/i.test(c.text)
  );
  const pool = weeklyCandidates.length ? weeklyCandidates : candidates;

  // Take the last one (most recent is typically at the bottom or top of a list)
  // Try both orderings and pick the one with a higher number if parseable
  const sortable = pool
    .map((c) => {
      const numMatch = c.text.match(/\b(\d{1,4})\b/);
      return { ...c, num: numMatch ? parseInt(numMatch[1], 10) : 0 };
    })
    .sort((a, b) => b.num - a.num);

  const best = sortable[0];
  let url = best.href;
  if (url.startsWith("/")) url = BASE_URL + url;
  if (!url.startsWith("http")) url = BASE_URL + "/" + url;
  return url;
}

async function fetchPdfUrlFromBulletinPage(bulletinPageUrl) {
  const res = await axios.get(bulletinPageUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; GeovisorBot/1.0)" },
    timeout: 30000,
  });
  const $ = cheerio.load(res.data);

  let pdfUrl = null;
  $("a[href]").each((_, el) => {
    if (pdfUrl) return;
    const href = $(el).attr("href") || "";
    if (/\.pdf/i.test(href)) {
      pdfUrl = href;
    }
  });

  if (!pdfUrl) return null;
  if (pdfUrl.startsWith("/")) pdfUrl = BASE_URL + pdfUrl;
  if (!pdfUrl.startsWith("http")) pdfUrl = BASE_URL + "/" + pdfUrl;
  return pdfUrl;
}

async function extractAlertFromPdf(pdfUrl) {
  const res = await axios.get(pdfUrl, {
    responseType: "arraybuffer",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; GeovisorBot/1.0)" },
    timeout: 60000,
  });
  const data = await pdfParse(Buffer.from(res.data));
  return extractAlertFromText(data.text);
}

async function scrapeBulletin() {
  const bulletinUrl = await fetchLatestBulletinUrl();
  if (!bulletinUrl) throw new Error("No bulletin link found on SGC page");

  const pdfUrl = await fetchPdfUrlFromBulletinPage(bulletinUrl);
  if (!pdfUrl) throw new Error(`No PDF found on bulletin page: ${bulletinUrl}`);

  const alert = await extractAlertFromPdf(pdfUrl);
  if (!alert) throw new Error(`Could not extract alert level from PDF: ${pdfUrl}`);

  return {
    ...alert,
    bulletinUrl,
    pdfUrl,
    weekKey: getISOWeekKey(new Date()),
    publishedAt: new Date(),
    scrapedAt: new Date(),
  };
}

module.exports = { scrapeBulletin, getISOWeekKey };
