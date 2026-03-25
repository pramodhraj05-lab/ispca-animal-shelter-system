const express = require("express");
const path = require("path"); 
const app = express();
const animalRoutes = require("./routes/animals");
const shelterRoutes = require("./routes/shelters");
app.use("/shelters", shelterRoutes);  
app.use(express.json());
app.use("/animals", animalRoutes);
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});