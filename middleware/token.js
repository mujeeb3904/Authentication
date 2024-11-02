const jwtSecret = process.env.jwtSecret;

function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(403).json("Access denied. No token provided.");
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.status(403).json("Invalid or expired token.");

    req.user = user; // Set user from the token payload
    next();
  });
}

module.exports = authenticateToken;
