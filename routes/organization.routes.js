import express from "express";
import upload from "../middlewares/multer.middlewares.js";
const router = express.Router();
import { issuedSkillCourse,issueSkillInternship } from "../controllers/organization.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";
router.post("/course",verifyJWT, issuedSkillCourse);
router.post("/internship",verifyJWT, issueSkillInternship);

export default router;