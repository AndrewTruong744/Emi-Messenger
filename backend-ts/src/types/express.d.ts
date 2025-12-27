import { Server } from 'socket.io';
import { User as PrismaUser} from '@prisma/client'

export {}; // This line is CRITICAL for module augmentation

declare global {
  namespace Express {
    interface Request {
      io: Server;
      user?: PrismaUser
    }
  }
}