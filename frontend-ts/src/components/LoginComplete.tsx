import { Navigate } from "react-router-dom";
import { useSocket } from "../helper/store";
import useAuth from "../helper/authStore";

function LoginComplete() {
  const setAccessToken = useAuth((state) => state.setAccessToken);
  const clearStore = useSocket((state) => state.clearStore);
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('accessToken');

  if (accessToken != null)
    setAccessToken(accessToken);
  
  clearStore();
  return <Navigate to="/home" replace/>;
}

export default LoginComplete;