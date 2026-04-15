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
      enum: ["social", "sgi_geo", "gidco", "mt_acquisition", "seismic_sensor", "field_participant"],
      required: true,
    },
    label: {
      type: String,
      default: undefined,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DataPoint", dataPointSchema);
