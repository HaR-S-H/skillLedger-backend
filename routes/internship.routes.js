import express from "express";
const router = express.Router();
import upload from "../middlewares/multer.middlewares.js";
import { createInternship,updateInternship,deleteInternship } from "../controllers/internship.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";
router.post("/",verifyJWT,upload.none(),createInternship);
router.put("/:id",verifyJWT, updateInternship);
router.delete("/:id",verifyJWT, deleteInternship);

export default router;