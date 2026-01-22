import { type StateCreator } from 'zustand';
import { type FullStore } from './useBoundStore';

export interface SystemSlice {
  loginMessage: string | null
  setLoginMessage: (loginMessage: string | null) => void
}

export const createSystemSlice : StateCreator<FullStore, [], [], SystemSlice> = (set) => ({
  loginMessage: null,
  setLoginMessage: (loginMessage) => {
    set({loginMessage});
  }
});
