import express from "express";
import authRouter from "./auth.js";
import generalRouter from "./general.js";

const router = express.Router();

router.use('/auth', authRouter);
router.use('/general', generalRouter);

export default router;