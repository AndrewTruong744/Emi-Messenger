import { Navigate } from "react-router-dom";
import { useSocket } from "../helper/store";

function LoginComplete() {
  const clearStore = useSocket((state) => state.clearStore);
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('accessToken');

  if (accessToken != null)
    sessionStorage.setItem("accessToken", accessToken);
  
  clearStore();
  return <Navigate to="/home" replace/>;
}

export default LoginComplete;