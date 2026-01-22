import { Server } from 'socket.io';
import { User as PrismaUser} from '@prisma/client'

export {};

// to let TypeScript know the request object will contain io for real time, and maybe the user information
declare global {
  namespace Express {
    interface Request {
      io: Server;
      user?: PrismaUser
    }
  }
}