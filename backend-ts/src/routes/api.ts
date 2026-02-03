import express from "express";
import authRouter from "./auth.js";
import conversationRouter from "./conversation.js";
import messageRouter from "./message.js";
import userRouter from "./user.js";
import {prisma} from "../db/prisma.js";

const router = express.Router();

router.use('/auth', authRouter);
router.use('/conversations', conversationRouter);
router.use('/messages', messageRouter);
router.use('/users', userRouter);

router.get('/health', async (req, res) => {
  try {
    await prisma.user.findFirst({select: {id: true}});
    res.status(200).send('OK');
  } catch (err) {
    console.error('Prisma has not deployed schema' + err);
    res.status(503).send('Prisma has not deployed schema');
  }
});

export default router;