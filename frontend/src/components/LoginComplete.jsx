import { Navigate } from "react-router-dom";
import { useAuth } from "../helper/store";

function LoginComplete() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('accessToken');

  sessionStorage.setItem("accessToken", accessToken);
  return <Navigate to="/messages" replace/>;
}

export default LoginComplete;