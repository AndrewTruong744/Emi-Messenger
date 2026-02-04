import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from "../styles/Login.module.css";
import api from '../helper/axios.js';
import Emi from '../assets/Emi6.jpg';
import Loading from './sub-components/Loading.js';
import { isAxiosError } from 'axios';
import { useBoundStore } from "../store/useBoundStore";

function Login() {
  const navigate = useNavigate();
  const setAccessToken = useBoundStore((state) => state.setAccessToken);
  const clearStore = useBoundStore((state) => state.clearStore);
  const loginMessage = useBoundStore((state) => state.loginMessage);
  const setLoginMessage = useBoundStore((state) => state.setLoginMessage);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    function newMessage() {
      setMessage(loginMessage);
      setLoginMessage(null);
    }

    if (loginMessage != null) {
      newMessage();
    }
  }, [loginMessage, setLoginMessage])

  const handleGoogleClick = () => {
    window.location.replace(`${import.meta.env.VITE_API_URL}/auth/login/google`);
  }

  const handleMicrosoftClick = () => {
    console.log('Microsoft!!!');
  }

  async function handleSubmit(e : React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    const loginData = {
      username: username,
      password: password
    }

    try {
      const res = await api.post('/auth/login', loginData);
      const accessToken = res.data.accessToken;
      setAccessToken(accessToken);
      
      clearStore();
      navigate('/home');
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response)
          setMessage('Username or password is incorrect');
        else if (err.request)
          setMessage('Network Error');
        else
          setMessage('Unknown Error');
      }
      else
        setMessage('System Error');
    }

    setIsLoading(false);
  }

  return (
    <div className={styles.login}>
      <div className={styles.logo}>
        <img src={Emi} className={styles.ceo} alt='Dog CEO' />
        <h1>Emi Messenger</h1>
        <h2>Talk the Talk, Walk the Walk</h2>
      </div>
      <div className={styles.right}>
        {message && 
          <div className={styles.error}>
            <p>{message}</p>
          </div>
        }
        <div className={styles.formAndOAuth}>
          {(isLoading) ? <Loading /> :
            <>
              <h2 className={styles.subTitle}>Login</h2>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.labelAndInput}>
                  <label htmlFor='username'>Username:</label>
                  <input
                    className={styles.input}
                    id='username'
                    name='username'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type='text'
                    required
                  />
                </div>
          
                <div className={styles.labelAndInput}>
                  <label htmlFor='password'>Password:</label>
                  <input
                    className={styles.input}
                    id='password'
                    name='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type='password'
                    required
                  />
                </div>

                <button type='submit' className={styles.button}>Login</button>
              </form>
              <div className={styles.oAuth}>
                <p className={styles.oAuthTitle}>Or Login Through</p>
                <div className={styles.buttons}>
                  <button onClick={handleGoogleClick} className={styles.button}>Google</button>
                  <button onClick={handleMicrosoftClick} className={styles.button}>Microsoft</button>
                </div>
              </div>
              <button className={styles.signup} onClick={() => navigate("/signup")}>Signup</button>
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default Login;