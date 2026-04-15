const mongoose = require("mongoose");

const sosAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // [latitude, longitude]
    position: {
      type: [Number],
      default: undefined,
    },
    message: {
      type: String,
      default: "Emergency SOS triggered",
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SosAlert", sosAlertSchema);
