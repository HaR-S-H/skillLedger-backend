import express from "express";
import upload from "../middlewares/multer.middlewares.js";
const router = express.Router();
import { createCourse, deleteCourse, updateCourse } from "../controllers/course.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";
router.post("/",verifyJWT, upload.fields([{ name: "coursePdf", maxCount: 1 }]), createCourse);
router.put("/:id",verifyJWT, updateCourse);
router.delete("/:id",verifyJWT, deleteCourse);

export default router;