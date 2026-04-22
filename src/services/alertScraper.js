const axios = require("axios");
const cheerio = require("cheerio");
const pdfParse = require("pdf-parse");
// pdf-parse v1 exports the function directly

const BASE_URL = "https://www2.sgc.gov.co";
const BULLETINS_PAGE =
  "https://www2.sgc.gov.co/sgc/volcanes/VolcanCerroMachin/Paginas/Boletines-Volcan-Cerro-Machin.aspx";

const LEVEL_KEYWORDS = {
  amarilla: "yellow",
  verde: "green",
  naranja: "orange",
  roja: "red",
};

const SPANISH_MONTHS = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

function getISOWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Parse the END date of a bulletin period from its URL or text.
// Pattern: "al_DD_de_MONTH_de_YYYY" or "al DD de MONTH de YYYY"
function parseBulletinEndDate(str) {
  const monthNames = Object.keys(SPANISH_MONTHS).join("|");
  const re = new RegExp(
    `al[_\\s]+(\\d{1,2})[_\\s]+de[_\\s]+(${monthNames})[_\\s]+de[_\\s]+(\\d{4})`,
    "i"
  );
  const m = str.match(re);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = SPANISH_MONTHS[m[2].toLowerCase()];
  const year = parseInt(m[3], 10);
  if (!month) return null;
  return new Date(year, month - 1, day);
}

function resolveUrl(href) {
  if (!href) return null;
  if (href.startsWith("http")) return href;
  if (href.startsWith("/")) return BASE_URL + href;
  return BASE_URL + "/" + href;
}

function extractAlertFromText(text) {
  const normalized = text.replace(/\s+/g, " ");

  const levelMatch = normalized.match(/alerta\s+(Amarilla|Verde|Naranja|Roja)/i);
  if (!levelMatch) return null;

  const alertLevel = LEVEL_KEYWORDS[levelMatch[1].toLowerCase()];
  if (!alertLevel) return null;

  const idx = normalized.search(/alerta\s+(Amarilla|Verde|Naranja|Roja)/i);

  let start = Math.max(0, idx - 200);
  const beforeChunk = normalized.substring(start, idx);
  const lastPeriod = beforeChunk.lastIndexOf(". ");
  if (lastPeriod !== -1) start = start + lastPeriod + 2;

  let end = Math.min(normalized.length, idx + 300);
  const afterChunk = normalized.substring(idx, end);
  const nextPeriod = afterChunk.search(/\.\s/);
  if (nextPeriod !== -1) end = idx + nextPeriod + 1;

  const alertText = normalized.substring(start, end).trim();
  return { alertLevel, alertText: alertText || levelMatch[0] };
}

async function fetchLatestBulletinInfo() {
  const res = await axios.get(BULLETINS_PAGE, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; GeovisorBot/1.0)" },
    timeout: 30000,
  });
  const $ = cheerio.load(res.data);

  const candidates = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    const combined = href + " " + text;
    if (/boletin|boletín/i.test(combined) && /semanal/i.test(combined)) {
      candidates.push({ href, text });
    }
  });

  // Fallback: any bulletin link
  if (!candidates.length) {
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim();
      if (/boletin|boletín/i.test(href + " " + text)) {
        candidates.push({ href, text });
      }
    });
  }

  if (!candidates.length) return null;

  // Sort by the bulletin period END date (parsed from URL/text), most recent first
  const dated = candidates.map((c) => {
    const endDate = parseBulletinEndDate(c.href) || parseBulletinEndDate(c.text);
    return { ...c, endDate: endDate ? endDate.getTime() : 0 };
  });

  dated.sort((a, b) => b.endDate - a.endDate);

  const best = dated[0];
  const resolvedUrl = resolveUrl(best.href);

  return {
    bulletinUrl: resolvedUrl,
    // If the link itself is already a PDF, use it directly
    isPdf: /\.pdf$/i.test(best.href),
  };
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
    if (/\.pdf/i.test(href)) pdfUrl = resolveUrl(href);
  });
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
  const info = await fetchLatestBulletinInfo();
  if (!info) throw new Error("No bulletin link found on SGC page");

  const { bulletinUrl, isPdf } = info;

  // If the link is already a PDF, use it directly — don't try to parse it as HTML
  let pdfUrl;
  if (isPdf) {
    pdfUrl = bulletinUrl;
  } else {
    pdfUrl = await fetchPdfUrlFromBulletinPage(bulletinUrl);
    if (!pdfUrl) throw new Error(`No PDF found on bulletin page: ${bulletinUrl}`);
  }

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
