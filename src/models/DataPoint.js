const mongoose = require("mongoose");

const dataPointSchema = new mongoose.Schema(
  {
    pointId: {
      type: String,
      required: true,
      unique: true,
    },
    // [latitude, longitude]
    position: {
      type: [Number],
      required: true,
    },
    type: {
      type: String,
      enum: ["social", "sgi_geo", "sgi_magnetometry", "sgi_gravimetry", "gidco", "uis_geophysics", "mt_acquisition"],
      required: true,
    },
    label: {
      type: String,
      default: undefined,
    },
    description: {
      type: String,
      default: undefined,
    },
    acquired: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DataPoint", dataPointSchema);
