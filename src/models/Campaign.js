const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
    },
    current: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    // Tailwind CSS class for progress bar color
    color: {
      type: String,
      default: "bg-orange-500",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Campaign", campaignSchema);
