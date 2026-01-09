import {create} from 'zustand';

interface UserAuth {
  accessToken: string | null,
  csrfToken: string | null,
  setAccessToken: (accessToken: string | null) => void,
  setCsrfToken: (csrfToken: string | null) => void,
  clearStore: () => void
}

const useAuth = create<UserAuth>()((set) => ({
  accessToken: null,
  csrfToken: null,
  setAccessToken: (accessToken) => {
    set({accessToken});
  },
  setCsrfToken: (csrfToken) => {
    set({csrfToken});
  },
  clearStore: () => {
    set({
      accessToken: null,
      csrfToken: null
    })
  }
}));

export default useAuth;