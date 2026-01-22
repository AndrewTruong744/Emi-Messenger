import { type StateCreator } from 'zustand';
import { type User } from "../types/storeTypes";
import { type FullStore } from './useBoundStore';

export interface UserSlice {
  currentUser: User | null,
  setCurrentUser: (currentUser : User) => void,
  clearUserSlice: () => void
}

export const createUserSlice : StateCreator<FullStore, [], [], UserSlice> = (set) => ({
  currentUser: null,
  setCurrentUser: (currentUser) => {
    set({currentUser});
  },
  clearUserSlice: () => {
    set({
      currentUser: null
    });
  }
});