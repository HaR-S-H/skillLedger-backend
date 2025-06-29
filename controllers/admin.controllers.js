import asyncHandler from "../utils/asyncHandler.js";
import Organization from "../models/organization.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import sendEmail from "../utils/sendEmail.js";
import acceptOrgQueue from "../queues/acceptOrganization.queues.js";
const getAdminDashboard = asyncHandler(async (req, res) => { 
    const organization = await Organization.find({});
    if(!organization) {
        throw new ApiError(404, "No organizations found");
    }
    return res.status(200).json(new ApiResponse(200,  organization , "Organizations fetched successfully"));
});

const acceptApplication = asyncHandler(async (req, res) => {
    const { id } = req.body;
    const organization = await Organization.findByIdAndUpdate(id, { status: "accepted" }, { new: true });
    if(!organization) {
        throw new ApiError(404, "Organization not found");
    }
    await acceptOrgQueue.add("approveAndNotify", {
        walletAddress:organization.walletAddress,
        email: organization.email,
        jobId: organization._id.toString(),
    },  { removeOnComplete: true, removeOnFail: true });

    await organization.save();
    return res.status(200).json(new ApiResponse(200, { jobId: organization._id.toString() }, "Organization accepted successfully"));
})

const rejectApplication = asyncHandler(async (req, res) => {
    const { id, reason } = req.body;
    if(!id || !reason) {
        throw new ApiError(400, "All fields are required");
    }
    const organization = await Organization.findByIdAndUpdate(id, { status: "rejected", rejectionReason: reason }, { new: true });
    if(!organization) {
        throw new ApiError(404, "Organization not found");
    }

    await sendEmail("application:rejected", {
         recipient: organization.email,
         subject: "Application Rejected",
            data: {reason},
    });
    await organization.save();
    return res.status(200).json(new ApiResponse(200, { organization }, "Organization rejected successfully"));
})




export  { getAdminDashboard,rejectApplication ,acceptApplication};