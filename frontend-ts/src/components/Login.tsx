import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from "../styles/Login.module.css";
import api from '../helper/axios.js';
import Emi from '../assets/Emi6.jpg';
import Loading from './sub-components/Loading.js';
import { isAxiosError } from 'axios';

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleClick = () => {
    window.location.replace(`${import.meta.env.VITE_API_URL}/auth/login/google`);
  }

  const handleMicrosoftClick = () => {
    console.log('Microsoft!!!');
  }

  async function handleSubmit(e : React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const loginData = {
      username: username,
      password: password
    }

    try {
      const res = await api.post('/auth/login', loginData);
      const accessToken = res.data.accessToken;
      console.log('Login successful!', res.data);
      sessionStorage.setItem("accessToken", accessToken);
      
      navigate('/home');
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response)
          setErrorMessage('Username or password is incorrect');
        else if (err.request)
          setErrorMessage('Network Error');
        else
          setErrorMessage('Unknown Error');
      }
      else
        setErrorMessage('System Error');
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
        {errorMessage && 
          <div className={styles.error}>
            <p>{errorMessage}</p>
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