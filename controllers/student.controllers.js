import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Student from "../models/student.models.js";
import Skill from "../models/issuedSkill.models.js";
import client from "../redis/connection.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
import pinFileToIPFS from "../utils/pinata.js";
const getStudentDashboard = asyncHandler(async (req, res) => {
  const key = `student:${req.user._id}:dashboard`;

  const data = await client.hgetall(key);

  let profile, skills;

  if (data && data.profile && data.skills) {
    profile = JSON.parse(data.profile);
    skills = JSON.parse(data.skills);
    return res.status(200).json(
      new ApiResponse(200, { student: profile, skills }, "Student dashboard fetched successfully from cache")
    );
  }
  const student = await Student.findById(req.user._id);
  skills = await Skill.find({ student: student._id }).populate("organization","name walletAddress").populate("programId","skillName courseName coursePdfLink startDate endDate courseLink description");

  if (!student || !skills) {
    throw new ApiError(404, "Student not found");
  }
  await client.hmset(key, {
    profile: JSON.stringify(student),
    skills: JSON.stringify(skills)
  });

  await client.expire(key, 3600);

  return res.status(200).json(
    new ApiResponse(200, { student, skills }, "Student dashboard fetched successfully")
  );
});
const sendOtptoEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required");
    }
 
    const student = await Student.findById(req.user._id);
        if (!student) {
        throw new ApiError(404, "Student not found");
    }
     const otp = crypto.randomInt(100000, 999999).toString();
    student.otp = otp;
    student.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await student.save();
    await sendEmail("otp", {
        recipient: email,
        subject: "Your OTP Code",
        data: { otp },
    });
    return res.status(200).json(new ApiResponse(200, { email }, "Email sended  successfully"));
})

const verifyOtp = asyncHandler(async (req, res) => { 
  const { otp } = req.body;
  if (!otp) {
    throw new ApiError(400, "OTP is required");
  }

  const student = await Student.findById(req.user._id);
  if (!student || !student.otp || student.otpExpires < Date.now()) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  if (student.otp !== otp) {
    throw new ApiError(400, "Incorrect OTP");
  }

  student.otp = null;
  student.otpExpires = null;
  student.isVerified = true;
  await student.save();

  // Update only profile in Redis dashboard hash
  const key = `student:${req.user._id}:dashboard`;
  const existingData = await client.hgetall(key);

  await client.hmset(key, {
    ...existingData,
    profile: JSON.stringify(student),
  });
  await client.expire(key, 3600);

  return res.status(200).json(new ApiResponse(200, {}, "OTP verified successfully"));
});


const editProfile = asyncHandler(async (req, res) => {
  const avatar = req.files?.avatar?.[0];

  if (avatar) {
    const avatarUrl = await pinFileToIPFS(avatar.buffer, "student");
    req.body.avatar = avatarUrl;
  }

  const student = await Student.findByIdAndUpdate(req.user._id, {
    ...req.body,
  }, { new: true }); // ✅ ensure updated data is returned

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const key = `student:${req.user._id}:dashboard`;
  const existingData = await client.hgetall(key);

  await client.hmset(key, {
    ...existingData,
    profile: JSON.stringify(student),
  });
  await client.expire(key, 3600);

  return res.status(200).json(new ApiResponse(200, { student }, "Profile updated successfully"));
});

const getStudent = asyncHandler(async (req, res) => {
    const { walletAddress } = req.body;
    if (!walletAddress) {
        throw new ApiError(400, "wallet address is required");
    }
    const student = await Student.findOne({ walletAddress });
    if (!Student) {
        throw new ApiError(400, "student not found");
    }
    const skills = await Skill.find({ student: student._id });
    return res.status(200).json(new ApiResponse(200, { student, skills }, "student fetcehd successfully"));
})
export  { getStudentDashboard,sendOtptoEmail, verifyOtp, editProfile ,getStudent};