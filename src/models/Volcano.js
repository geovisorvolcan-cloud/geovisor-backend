const mongoose = require("mongoose");

const volcanoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    // [latitude, longitude]
    position: {
      type: [Number],
      required: true,
    },
    alertLevel: {
      type: String,
      enum: ["Normal", "Advisory", "Watch", "Warning"],
      default: "Watch",
    },
    description: {
      type: String,
      default: "",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Volcano", volcanoSchema);
