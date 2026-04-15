/**
 * Seed script — populates MongoDB with the mock data from the frontend.
 * Run once: npm run seed
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../src/models/User");
const DataPoint = require("../src/models/DataPoint");
const Volcano = require("../src/models/Volcano");
const Campaign = require("../src/models/Campaign");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/geovisor";

const users = [
  {
    name: "Ana",
    email: "ana@geovisor.com",
    password: "password123",
    role: "field",
    status: "Active",
    location: "Santiago, Chile",
    position: [4.535, -75.395],
    volcanoAlert: "Watch",
  },
  {
    name: "Carlos",
    email: "carlos@geovisor.com",
    password: "password123",
    role: "office",
    status: "Active",
    location: "Bogotá, Colombia",
    volcanoAlert: "Watch",
  },
  {
    name: "Admin",
    email: "admin@geovisor.com",
    password: "admin1234",
    role: "admin",
    status: "Active",
    location: "Bogotá, Colombia",
    volcanoAlert: "Watch",
  },
];

const dataPoints = [
  // Field participants (red pins)
  { pointId: "fp1", position: [4.535, -75.395], type: "field_participant", label: "Ana" },
  { pointId: "fp2", position: [4.505, -75.355], type: "field_participant" },
  { pointId: "fp3", position: [4.498, -75.408], type: "field_participant" },

  // Social & Environmental (blue circles)
  { pointId: "se1", position: [4.540, -75.370], type: "social" },
  { pointId: "se2", position: [4.495, -75.345], type: "social" },

  // SGI GEO (purple circles)
  { pointId: "sg1", position: [4.525, -75.385], type: "sgi_geo" },
  { pointId: "sg2", position: [4.510, -75.360], type: "sgi_geo" },

  // GIDCO (green circles)
  { pointId: "gi1", position: [4.550, -75.375], type: "gidco" },
  { pointId: "gi2", position: [4.545, -75.355], type: "gidco" },
  { pointId: "gi3", position: [4.538, -75.400], type: "gidco" },
  { pointId: "gi4", position: [4.530, -75.345], type: "gidco" },
  { pointId: "gi5", position: [4.520, -75.410], type: "gidco" },
  { pointId: "gi6", position: [4.510, -75.390], type: "gidco" },
  { pointId: "gi7", position: [4.502, -75.370], type: "gidco" },
  { pointId: "gi8", position: [4.495, -75.355], type: "gidco" },
  { pointId: "gi9", position: [4.488, -75.390], type: "gidco" },
  { pointId: "gi10", position: [4.480, -75.365], type: "gidco" },
  { pointId: "gi11", position: [4.475, -75.395], type: "gidco" },
  { pointId: "gi12", position: [4.470, -75.370], type: "gidco" },

  // MT Acquisition (orange circles)
  { pointId: "mt1", position: [4.542, -75.390], type: "mt_acquisition" },
  { pointId: "mt2", position: [4.498, -75.360], type: "mt_acquisition" },

  // Seismic sensors
  { pointId: "ss1", position: [4.515, -75.415], type: "seismic_sensor" },
  { pointId: "ss2", position: [4.490, -75.380], type: "seismic_sensor" },
];

const volcanoData = {
  name: "Cerro Machín",
  position: [4.5188, -75.3802],
  alertLevel: "Watch",
  description: "Heightened unrest",
  lastUpdated: new Date(),
};

const campaigns = [
  { label: "Social and environmental characterization", current: 1, total: 99, color: "bg-purple-600", order: 0 },
  { label: "SGI GEO progress", current: 5, total: 99, color: "bg-purple-600", order: 1 },
  { label: "GIDCO progress", current: 12, total: 99, color: "bg-orange-500", order: 2 },
  { label: "MT acquisition progress", current: 2, total: 10, color: "bg-orange-400", order: 3 },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    DataPoint.deleteMany({}),
    Volcano.deleteMany({}),
    Campaign.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  // Insert users (passwords are hashed by pre-save hook)
  for (const u of users) {
    await User.create(u);
  }
  console.log(`Seeded ${users.length} users`);

  await DataPoint.insertMany(dataPoints);
  console.log(`Seeded ${dataPoints.length} data points`);

  await Volcano.create(volcanoData);
  console.log("Seeded volcano data");

  await Campaign.insertMany(campaigns);
  console.log(`Seeded ${campaigns.length} campaigns`);

  console.log("\nSeed complete! Default credentials:");
  console.log("  ana@geovisor.com      / password123  (field)");
  console.log("  carlos@geovisor.com   / password123  (office)");
  console.log("  admin@geovisor.com    / admin1234     (admin)");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
