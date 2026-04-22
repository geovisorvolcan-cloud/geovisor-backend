const mongoose = require("mongoose");

const volcanBulletinSchema = new mongoose.Schema(
  {
    // ISO week identifier for deduplication e.g. "2026-W17"
    weekKey: { type: String, required: true, unique: true },
    alertLevel: {
      type: String,
      enum: ["green", "yellow", "orange", "red"],
      required: true,
    },
    alertText: { type: String, required: true },
    bulletinUrl: { type: String, default: "" },
    pdfUrl: { type: String, default: "" },
    publishedAt: { type: Date },
    scrapedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VolcanBulletin", volcanBulletinSchema);
