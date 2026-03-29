const jwt = require("jsonwebtoken");

const SECRET = "secretkey";

function verifyToken(req, res, next) {
  const header = req.headers["authorization"];

  if (!header) {
    return res.status(403).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1];

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = decoded;
    next();
  });
}

module.exports = verifyToken;