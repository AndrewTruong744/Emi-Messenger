import {Outlet, Navigate} from 'react-router-dom';
import {useState, useEffect} from 'react';
import api from '../helper/axios.js';

function Auth() {
  const [valid, setValid] = useState(null);
  useEffect(() => {
    async function validateAccessToken() {
      try {
        await api.get('/authenticate');
        setValid(true);
      } catch (err) {
        console.log(err);
        setValid(false);
      }
    }

    if (valid === null)
      validateAccessToken();
    
  }, [setValid, valid])
  
  if (valid === null)
    return <h1>Login Complete!</h1>
  else if (valid === true)
    return <Outlet />;
  else
    return <Navigate to="/login" replace/>;
}

export default Auth;