import {Outlet, Navigate} from 'react-router-dom';
import {useState, useEffect} from 'react';
import api from '../helper/axios.js';
import styles from "../styles/Auth.module.css";
import Loading from './sub-components/Loading.jsx';

function Auth() {
  const [valid, setValid] = useState(null);
  useEffect(() => {
    async function validateAccessToken() {
      try {
        await api.get('/auth/authenticate');
        setValid(true);
      } catch (err) {
        console.log(err);
        setValid(false);
      }
    }

    validateAccessToken();
    
  }, [])
  
  if (valid === null) {
    return (
      <div className={styles.auth}>
        <h1>Authenticating...</h1>
        <Loading />
      </div>
    );
  }
  else if (valid === true)
    return <Outlet />;
  else
    return <Navigate to="/login" replace/>;
}

export default Auth;