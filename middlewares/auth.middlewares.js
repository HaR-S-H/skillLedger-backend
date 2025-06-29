import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.models.js";
import Organization from "../models/organization.models.js";
import Student from "../models/student.models.js";
const verifyJWT = asyncHandler(async (req, res, next) => {
    try { 
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            
            throw new ApiError(401, "Unauthorized request");
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        let user;
        if (decodedToken.role === "student") {
             user = await Student.findById(decodedToken._id).select("-otp -otpExpires")
            if (!user) {
                throw new ApiError(401, "invalid Access Token")
            }
         }
        else if(decodedToken.role === "organization") {
             user = await Organization.findById(decodedToken._id)
            if (!user) {
                throw new ApiError(401, "invalid Access Token")
            }
        }
        else if(decodedToken.role === "admin") {
             user = await Admin.findById(decodedToken._id)
            if (!user) {
                throw new ApiError(401, "invalid Access Token")
            }
        }
        else {
            throw new ApiError(401, "invalid Access Token")
        }
        
        user.role = decodedToken.role;
        req.user = user;

        next()
    } catch (error) {
        throw new ApiError(401,error.message || "invalid access Token")
    }
})


export default verifyJWT;