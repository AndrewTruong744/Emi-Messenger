import {type Handshake} from "socket.io"

// lets Typescript know the structure of the user object injected
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