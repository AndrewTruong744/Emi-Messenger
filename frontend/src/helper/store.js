import {create} from 'zustand'

const useAuth = create((set) => ({
  accessToken: "",
  authSuccess: (newAccessToken) => set({accessToken: newAccessToken}),
  authFail: () => set({accessToken: ""})
}))

export {useAuth};