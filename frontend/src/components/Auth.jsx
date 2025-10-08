import {Outlet, Navigate} from 'react-router-dom'
import {create} from 'zustand'

const useAuth = create((set) => ({
  isAuthenticated: false,
  authSuccess: () => set({isAuthenticated: true}),
  authFail: () => set({isAuthenticated: false})
}))

function Auth() {
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace/>
}

export default Auth;