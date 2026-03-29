const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use("/auth", require("./routes/auth"));

const animalRoutes = require("./routes/animals");
const shelterRoutes = require("./routes/shelters");
const adoptionRoutes = require("./routes/adoptions");

app.use("/animals", animalRoutes);
app.use("/shelters", shelterRoutes);
app.use("/adoptions", adoptionRoutes);

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});