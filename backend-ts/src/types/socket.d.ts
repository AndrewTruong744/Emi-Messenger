import {type Handshake} from "socket.io"

declare module "socket.io" {
  interface Socket {
    user?: {
      id: string,
      username: string,
      iat?: number,
      exp?: number,
    };
    handshake : Handshake;
  }
}