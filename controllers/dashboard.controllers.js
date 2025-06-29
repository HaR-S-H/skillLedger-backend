import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { getAdminDashboard } from "./admin.controllers.js";
import { getOrganizationDashboard } from "./organization.controllers.js";
import { getStudentDashboard } from "./student.controllers.js";
const getDashboard = asyncHandler(async (req, res) => {
    
    const { walletAddress, role } = req.user;
    
    if (!walletAddress) {
        throw new ApiError(400, "Wallet address is required");
    }
    if (role == "admin") {
        getAdminDashboard(req, res);
    }
    else if (role == "organization") { 
        getOrganizationDashboard(req, res);
    }
    else {
        getStudentDashboard(req, res);
    }
})

export default getDashboard;