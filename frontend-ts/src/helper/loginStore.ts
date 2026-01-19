import {create} from 'zustand';

// CHANGE THIS TO LIKE SYSTEM MESSAGE STORE
interface UserLogin {
  loginMessage: string | null
  setLoginMessage: (loginMessage: string | null) => void
}

const useLogin = create<UserLogin>()((set) => ({
  loginMessage: null,
  setLoginMessage: (loginMessage) => {
    set({loginMessage});
  }
}));

export default useLogin;