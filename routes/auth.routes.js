import express from "express";
const router = express.Router();
import { loginUser, createOrganization, getUser } from "../controllers/auth.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";
router.post("/login", loginUser);
router.post("/organization/signup", createOrganization);
router.post("/me",verifyJWT,getUser);

export default router;