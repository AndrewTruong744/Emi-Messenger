import {type StateCreator} from 'zustand';
import { type FullStore } from './useBoundStore';

export interface AuthSlice {
  accessToken: string | null,
  csrfToken: string | null,
  setAccessToken: (accessToken: string | null) => void,
  setCsrfToken: (csrfToken: string | null) => void,
  clearAuthSlice: () => void
}

export const createAuthSlice : StateCreator<FullStore, [], [], AuthSlice> = (set) => ({
  accessToken: null,
  csrfToken: null,
  setAccessToken: (accessToken) => {
    set({accessToken});
  },
  setCsrfToken: (csrfToken) => {
    set({csrfToken});
  },
  clearAuthSlice: () => {
    set({
      accessToken: null,
      csrfToken: null
    })
  }
});