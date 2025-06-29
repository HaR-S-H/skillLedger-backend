import express from "express";
const router = express.Router();
import getDashboard from "../controllers/dashboard.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";
router.get("/",verifyJWT, getDashboard);

export default router;