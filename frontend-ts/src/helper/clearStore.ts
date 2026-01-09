import {create} from 'zustand';
import useAuth from './authStore';
import { useSocket } from './store';

interface UserClear {
  clearStore: () => void
}

const useClear = create<UserClear>()(() => ({
  clearStore: () => {
    useAuth.getState().clearStore();
    useSocket.getState().clearStore();
  }
}));

export default useClear;