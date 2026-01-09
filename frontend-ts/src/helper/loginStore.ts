import {create} from 'zustand';

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