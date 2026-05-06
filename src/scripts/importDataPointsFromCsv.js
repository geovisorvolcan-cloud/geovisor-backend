require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const fs = require("fs");
const mongoose = require("mongoose");
const DataPoint = require("../models/DataPoint");

const SOURCE_TYPES = {
  grav: "sgi_gravimetry",
  mag: "sgi_magnetometry",
};

const ENTITY_TYPES = {
  gidco: "gidco",
  uis: "uis_geophysics",
};

function usage() {
  return [
    "Usage:",
    "  node src/scripts/importDataPointsFromCsv.js [--dry-run] [--insert-only] --grav <file> --mag <file> --mt <file>",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { dryRun: false, insertOnly: false, files: {} };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (arg === "--insert-only") {
      args.insertOnly = true;
      continue;
    }

    if (arg === "--grav" || arg === "--mag" || arg === "--mt") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing file path after ${arg}`);
      }
      args.files[arg.slice(2)] = value;
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  for (const key of ["grav", "mag", "mt"]) {
    if (!args.files[key]) {
      throw new Error(`Missing --${key} <file>`);
    }
  }

  return args;
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseCsv(text, delimiter = ";") {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        field += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((cell) => normalizeText(cell))) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => normalizeText(cell))) rows.push(row);

  if (inQuotes) {
    throw new Error("CSV parse failed: unterminated quoted field");
  }

  return rows;
}

function toObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((header) => normalizeText(header));

  return rows.slice(1).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = normalizeText(row[index]);
    });
    return item;
  });
}

function cell(row, prefix) {
  const wanted = normalizeKey(prefix);
  const key = Object.keys(row).find((header) => normalizeKey(header).startsWith(wanted));
  return key ? row[key] : "";
}

function parseDecimal(value) {
  const normalized = normalizeText(value).replace(",", ".");
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function pointTypeFor(source, entity) {
  if (SOURCE_TYPES[source]) return SOURCE_TYPES[source];

  const normalizedEntity = normalizeKey(entity);
  const type = ENTITY_TYPES[normalizedEntity];
  if (!type) {
    throw new Error(`Unsupported magnetotelluric entity: ${entity || "<blank>"}`);
  }
  return type;
}

function parseFile(source, filePath) {
  const text = fs.readFileSync(filePath, "latin1");
  const rows = toObjects(parseCsv(text));
  const points = [];
  const skipped = [];

  for (const row of rows) {
    const pointId = cell(row, "estacion");
    if (!pointId) continue;

    const latitude = parseDecimal(cell(row, "latitud"));
    const longitude = parseDecimal(cell(row, "longitud ("));

    if (latitude === undefined || longitude === undefined) {
      skipped.push({ pointId, reason: "missing coordinates" });
      continue;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      skipped.push({ pointId, reason: "coordinates out of range" });
      continue;
    }

    const location = cell(row, "localizacion");
    const observations = cell(row, "observaciones");
    const description = [location, observations]
      .map(normalizeText)
      .filter(Boolean)
      .filter((part, index, parts) => parts.indexOf(part) === index)
      .join(" ");

    points.push({
      pointId,
      position: [latitude, longitude],
      type: pointTypeFor(source, cell(row, "entidad")),
      label: pointId,
      description: description || undefined,
    });
  }

  return { points, skipped };
}

function samePoint(incoming, existing) {
  if (!existing) return false;
  const position = Array.isArray(existing.position) ? existing.position : [];
  const samePosition =
    position.length === 2 &&
    Math.abs(Number(position[0]) - incoming.position[0]) < 1e-9 &&
    Math.abs(Number(position[1]) - incoming.position[1]) < 1e-9;

  return (
    samePosition &&
    existing.type === incoming.type &&
    (existing.label || "") === (incoming.label || "") &&
    (existing.description || "") === (incoming.description || "")
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const allPoints = [];
  const skipped = [];

  for (const [source, filePath] of Object.entries(args.files)) {
    const parsed = parseFile(source, filePath);
    allPoints.push(...parsed.points);
    skipped.push(...parsed.skipped.map((item) => ({ ...item, source })));
  }

  const seen = new Set();
  const duplicates = [];
  for (const point of allPoints) {
    if (seen.has(point.pointId)) duplicates.push(point.pointId);
    seen.add(point.pointId);
  }
  if (duplicates.length) {
    throw new Error(`Duplicate point IDs in CSV input: ${duplicates.join(", ")}`);
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const existingPoints = await DataPoint.find({ pointId: { $in: allPoints.map((point) => point.pointId) } })
    .select("pointId position type label description acquired")
    .lean();
  const existingById = new Map(existingPoints.map((point) => [point.pointId, point]));

  const summary = {
    parsed: allPoints.length,
    skipped: skipped.length,
    existing: 0,
    wouldInsert: 0,
    wouldUpdate: 0,
    changedExisting: 0,
    unchanged: 0,
    inserted: 0,
    updated: 0,
    skippedExisting: 0,
  };

  for (const point of allPoints) {
    const existing = existingById.get(point.pointId);
    if (!existing) {
      summary.wouldInsert += 1;
    } else if (samePoint(point, existing)) {
      summary.existing += 1;
      summary.unchanged += 1;
    } else {
      summary.existing += 1;
      summary.changedExisting += 1;
      if (!args.insertOnly) summary.wouldUpdate += 1;
    }

    if (!args.dryRun) {
      if (args.insertOnly && existing) {
        summary.skippedExisting += 1;
        continue;
      }

      const result = await DataPoint.updateOne(
        { pointId: point.pointId },
        {
          $set: point,
          $setOnInsert: { acquired: false },
        },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );

      if (result.upsertedCount) summary.inserted += 1;
      else if (result.modifiedCount) summary.updated += 1;
    }
  }

  const counts = await DataPoint.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const afterCount = await DataPoint.countDocuments({ pointId: { $in: allPoints.map((point) => point.pointId) } });

  console.log(args.dryRun ? "Dry run complete." : "Import complete.");
  console.log(
    `Parsed ${summary.parsed} importable points; skipped ${summary.skipped} rows without usable coordinates.`
  );
  if (skipped.length) {
    console.log(`Skipped point IDs: ${skipped.map((item) => item.pointId).join(", ")}`);
  }
  console.log(
    `Existing ${summary.existing}; would insert ${summary.wouldInsert}; changed existing ${summary.changedExisting}; unchanged ${summary.unchanged}.`
  );
  if (args.insertOnly) {
    console.log("Insert-only mode enabled: existing records are not updated.");
  } else {
    console.log(`Would update ${summary.wouldUpdate} existing records.`);
  }
  if (!args.dryRun) {
    console.log(`Inserted ${summary.inserted}; updated ${summary.updated}; skipped existing ${summary.skippedExisting}.`);
  }
  console.log(`Verified ${afterCount}/${summary.parsed} importable CSV points are present in MongoDB.`);
  console.log(`Current DataPoint counts by type: ${counts.map((item) => `${item._id}=${item.count}`).join(", ")}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect failures during error handling
  }
  console.error(usage());
  process.exit(1);
});
