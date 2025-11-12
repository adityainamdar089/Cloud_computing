import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import { createError } from "../error.js";

dotenv.config();

const JWT_SECRET = 
  (process.env.JWT_SECRET && process.env.JWT_SECRET !== "change-me") 
    ? process.env.JWT_SECRET 
    : (process.env.JWT && process.env.JWT !== "change-me")
      ? process.env.JWT
      : "suraASDjgaKSADFJBAitte6708";

const buildUserContext = (decodedToken) => {
  if (!decodedToken) return null;

  const tokenUser = decodedToken.user ?? {};
  const candidate = {
    ...tokenUser,
    _id:
      tokenUser._id ??
      tokenUser.userId ??
      decodedToken.userId ??
      decodedToken._id ??
      decodedToken.sub ??
      null,
  };

  if (!candidate.userId && candidate._id) {
    candidate.userId = candidate._id;
  }

  if (!candidate._id) {
    return null;
  }

  return candidate;
};

export const verifyToken = async (req, res, next) => {
  try {
    // Check if JWT_SECRET is configured
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not properly configured!");
      return next(createError(500, "Server configuration error"));
    }

    if (!req.headers.authorization) {
      return next(createError(401, "You are not authenticated!"));
    }

    const token = req.headers.authorization.split(" ")[1];

    if (!token) return next(createError(401, "You are not authenticated"));

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = buildUserContext(decoded);

    if (!user) {
      console.error("User context missing - decoded token:", decoded);
      return next(createError(401, "User context missing"));
    }

    req.user = user;
    return next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    if (err.name === "JsonWebTokenError") {
      return next(createError(401, "Invalid token"));
    } else if (err.name === "TokenExpiredError") {
      return next(createError(401, "Token expired"));
    }
    return next(createError(401, "You are not authenticated!"));
  }
};
