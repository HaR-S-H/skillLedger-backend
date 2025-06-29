import express from "express";
const router = express.Router();
import { acceptApplication, rejectApplication }  from "../controllers/admin.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";
router.post("/accept",verifyJWT, acceptApplication);
router.post("/reject",verifyJWT, rejectApplication);

export default router;