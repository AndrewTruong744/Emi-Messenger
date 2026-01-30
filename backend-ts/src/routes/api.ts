import express from "express";
import authRouter from "./auth.js";
import conversationRouter from "./conversation.js";
import messageRouter from "./message.js";
import userRouter from "./user.js"

const router = express.Router();

router.use('/auth', authRouter);
router.use('/conversations', conversationRouter);
router.use('/messages', messageRouter);
router.use('/users', userRouter);

router.get('/health', (req, res) => {
  res.status(200).send('OK');
});

export default router;