import asyncHandler from "../utils/asyncHandler.js";
import Organization from "../models/organization.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Admin from "../models/admin.models.js";
import Student from "../models/student.models.js";
import { pub } from "../redis/pubsub.js";
const loginUser = asyncHandler(async (req, res) => {
    const { walletAddress } = req.body;
    console.log(walletAddress);
    
    if(!walletAddress) {
        throw new ApiError(400, "Wallet address is required");
    }
    let existingUser = await Admin.findOne({ walletAddress });
    if(existingUser) {
        const token = existingUser.generateAccessToken();
        return res.status(201).cookie("token", token).json(new ApiResponse(200, { token, role: "admin" } , "Admin logged in successfully"));
    }
    if(walletAddress == process.env.ADMIN_WALLET_ADDRESS) {
        const admin = new Admin({ walletAddress });
        await admin.save();
        const token = admin.generateAccessToken();
        return res.status(201).cookie("token", token).json(new ApiResponse(200,  { token, role: "admin" }, "Admin created successfully"));
    }
    existingUser = await Organization.findOne({ walletAddress });
    if (existingUser) {
        const token = existingUser.generateAccessToken();
        return res.status(201).cookie("token", token).json(new ApiResponse(200, { token, role: "organization" }, "Organization logged in successfully"));
    }
    existingUser = await Student.findOne({ walletAddress });
    if(existingUser) {
        const token = existingUser.generateAccessToken();
        return res.status(201).cookie("token", token).json(new ApiResponse(200, { token, role: "student" }, "Student logged in successfully"));
    }
    const student = new Student({ walletAddress });
    await student.save();
    const token = student.generateAccessToken();
    return res.status(201).cookie("token", token).json(new ApiResponse(200,  { token, role: "student" } , "Student created successfully"));
})

const createOrganization = asyncHandler(async (req, res) => { 
    const { name, description, email, walletAddress, website, credentialTypes, contactPerson } = req.body;
    if (!name || !description || !email || !walletAddress || !website || !credentialTypes || !contactPerson) {
        throw new ApiError(400, "All fields are required");
    };
    const existingWalletAddress = await Student.findOne({ walletAddress :walletAddress.toLowerCase()});
    if (existingWalletAddress) {
        throw new ApiError(409, "wallet Address already exists");
    }
    const existingOrganization = await Organization.findOne({ walletAddress });
    if (existingOrganization) {
        throw new ApiError(409, "Organization already exists");
    }
    const organization = new Organization({
        name,
        description,
        email,
        walletAddress,
        website,
        status: "pending",
        credentialTypes,
        contactPerson
    });
    await organization.save();
    await pub.publish(`organizations`, JSON.stringify(organization));
    // const token = organization.generateAccessToken();
    return res.status(201).json(new ApiResponse(200, { }, "Organization created successfully"));
});

const getUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {
        role: req.user.role,
        walletAddress: req.user.walletAddress
    }, "role and walletAdress fetched successfully"));
})

export { loginUser, createOrganization,getUser };