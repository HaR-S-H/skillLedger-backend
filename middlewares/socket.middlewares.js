import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import Admin from "../models/admin.models.js";
import Organization from "../models/organization.models.js";
import dotenv from "dotenv";
dotenv.config();
const socketAuthAny = async (socket, next) => {
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
      return next(new Error("Unauthorized request"));
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const walletAddress = decoded.walletAddress;

    if (decoded.role === "admin") {
      const admin = await Admin.findOne({ walletAddress });
      if (!admin) return next(new Error("Unauthorized request"));
    }

    if (decoded.role === "organization") {
      const organization = await Organization.findOne({ walletAddress });
      if (!organization) return next(new Error("Unauthorized request"));
    }

    socket.user = decoded;
    next();
  } catch (error) {
    console.error("Socket auth error:", error.message);
    next(new Error("Unauthorized request"));
  }
};

export default socketAuthAny;
