import { Navigate } from "react-router-dom";
import { useAuth } from "../helper/store";

function LoginComplete() {
  const authSuccess = useAuth((state) => state.authSuccess);
  authSuccess(window.location.hash);
  console.log(window.location.hash);

  return <Navigate to="/messages" replace/>;
}

export default LoginComplete;