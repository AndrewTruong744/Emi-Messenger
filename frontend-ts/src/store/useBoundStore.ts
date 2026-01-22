import { create } from "zustand";
import { type AuthSlice, createAuthSlice } from "./authStore";
import { type ChatSlice, createChatSlice } from "./chatSlice";
import { type SocketSlice,  createSocketSlice } from "./socketSlice";
import { type UserSlice, createUserSlice } from "./userSlice";
import { type SystemSlice, createSystemSlice } from "./systemSlice";

export type GlobalActions = {
  clearStore: () => void;
}

export type FullStore = 
  AuthSlice & 
  ChatSlice & 
  SocketSlice & 
  UserSlice & 
  SystemSlice &
  GlobalActions;

export const useBoundStore = create<FullStore>()((set, get, ...a) => ({
  ...createAuthSlice(set, get, ...a),
  ...createChatSlice(set, get, ...a),
  ...createSocketSlice(set, get, ...a),
  ...createUserSlice(set, get, ...a),
  ...createSystemSlice(set, get, ...a),

  clearStore: () => {
    get().disconnect();
    get().clearAuthSlice();
    get().clearChatSlice();
    get().clearUserSlice();
  }
})); 