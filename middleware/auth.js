const jwt =require('jsonwebtoken')
require('dotenv').config()
const user = require('../models/user')

const auth = async (req, res, next) => {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
      }
  
      jwt.verify(token,process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Session expired. Please log in again." });
          }
          return res.status(401).json({ message: "Invalid token. Please authenticate." });
        }
  
        req.token = decoded;
        req.user = decoded;
        next();
      });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  };


activate = function requireActivation(req, res, next) {
    if (!req.user.activationStatus) {
      return res.status(403).json({ message: "Account not activated" });
    }
    next();
  };

const authorizeRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
};

module.exports= {
    auth,
    activate,
    authorizeRole
}
