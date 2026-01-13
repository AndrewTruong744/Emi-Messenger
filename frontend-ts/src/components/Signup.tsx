import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import api from '../helper/axios.js';
import styles from "../styles/Signup.module.css";
import Loading from './sub-components/Loading.js';
import EmiKawaii from "../assets/EmiKawaii.jpg";
import { isAxiosError } from 'axios';

function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
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

    const signupData = {
      username,
      password,
      email,
    }

    try {
      const res = await api.post('/auth/signup', signupData);
      console.log('Signup successful!', res.data);
      
      navigate('/login');
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response)
          setErrorMessage("User already exists");
        else if (err.request)
          setErrorMessage("Network Error");
        else
          setErrorMessage('Unknown error');
      }
      else
        setErrorMessage('System error');
    }
  }


  return (
    <div className={styles.signup}>
      <div className={styles.logo}>
        <img src={EmiKawaii} className={styles.ceo} alt='Dog CEO' />
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
              <h2 className={styles.subTitle}>Signup</h2>
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

                <div className={styles.labelAndInput}>
                  <label htmlFor='email'>Email:</label>
                  <input
                    className={styles.input}
                    id='email'
                    name='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type='email'
                    required
                  />
                </div>

                <button type='submit' className={styles.button}>Signup</button>
              </form>
              <div className={styles.oAuth}>
                <p className={styles.oAuthTitle}>Or Login Through</p>
                <div className={styles.buttons}>
                  <button onClick={handleGoogleClick} className={styles.button}>Google</button>
                  <button onClick={handleMicrosoftClick} className={styles.button}>Microsoft</button>
                </div>
              </div>
              <button className={styles.login} onClick={() => navigate("/login")}>Login</button>
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default Signup;