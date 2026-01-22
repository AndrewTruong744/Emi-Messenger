import { Navigate } from "react-router-dom";
import { useBoundStore } from "../store/useBoundStore";

function LoginComplete() {
  const setAccessToken = useBoundStore((state) => state.setAccessToken);
  const clearStore = useBoundStore((state) => state.clearStore);
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('accessToken');

  if (accessToken != null)
    setAccessToken(accessToken);
  
  clearStore();
  return <Navigate to="/home" replace/>;
}

export default LoginComplete;