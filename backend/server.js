const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// ── MIDDLEWARE ───────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── STATIC FILES ─────────────────────────────────
app.use(express.static(path.join(__dirname, "../frontend")));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── ROUTES ────────────────────────────────────────
const authRoutes     = require("./routes/auth");
const animalRoutes   = require("./routes/animals");
const shelterRoutes  = require("./routes/shelters");
const adoptionRoutes = require("./routes/adoptions");
const { authMiddleware, adminOnly } = require("./middleware/auth");

app.use("/auth", authRoutes);

app.use("/animals",   animalRoutes);
app.use("/shelters",  shelterRoutes);
app.use("/adoptions", adoptionRoutes);

// ── FRONTEND ROUTES ───────────────────────────────
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dashboard.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ── START ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🐾 ISPCA running on http://localhost:${PORT}`);
  console.log(`   Admin login: admin@pawhaven.com / admin123\n`);
});
