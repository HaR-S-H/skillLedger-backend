import express from "express";
import upload from "../middlewares/multer.middlewares.js";
const router = express.Router();
import { editProfile, sendOtptoEmail,verifyOtp,getStudent} from "../controllers/student.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";
router.post("/",verifyJWT, upload.fields([{ name: "avatar", maxCount: 1 }]), editProfile);
router.post("/sendOtp",verifyJWT,sendOtptoEmail);
router.post("/verify",verifyJWT, verifyOtp);
router.post("/search", getStudent);

export default router;