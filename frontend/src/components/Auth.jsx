import {Outlet, Navigate} from 'react-router-dom';
import {useAuth} from '../helper/store.js';

function Auth() {
  const accessToken = useAuth((state) => state.accessToken);
  return accessToken.length !== 0 ? <Outlet /> : <Navigate to="/login" replace/>
}

export default Auth;