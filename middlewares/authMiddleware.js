import jwt from "jsonwebtoken";
import User from "../models/User.js";


const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      //  Attach user to req
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      console.error("Token error:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

export default protect;

export const isAdmin = (req, res, next) => {
  if (!req.user?.isAdmin==true) {
    return res.status(403).json({ message: "Admin access denied" });
  }
  next();
};
