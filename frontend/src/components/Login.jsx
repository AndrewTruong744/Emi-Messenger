import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from "../styles/Login.module.css";
import api from '../helper/axios.js';
import Emi from '../assets/Emi6.jpg';

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  //const [message, setMessage] = useState('');
  //implement this later
  //const [isLoading, setIsLoading] = useState(true);

  const handleGoogleClick = () => {
    window.location.replace(`${import.meta.env.VITE_API_URL}/auth/login/google`);
  }

  const handleMicrosoftClick = () => {
    console.log('Microsoft!!!');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const loginData = {
      username: username,
      password: password
    }

    try {
      const res = await api.post('/auth/login', loginData);
      const accessToken = res.data.accessToken;
      console.log('Login successful!', res.data);
      sessionStorage.setItem("accessToken", accessToken);
      
      navigate('/messages');
    } catch (err) {
      if (err.response)
        console.error('Login Error');
      else if (err.request)
        console.error('Network Error');
      else
        console.error('Unknown error');
    }
  }

  return (
    <div className={styles.login}>
      <div className={styles.logo}>
        <img src={Emi} className={styles.ceo} alt='Dog CEO' />
        <h1>Emi Messenger</h1>
        <h2>Talk the Talk, Walk the Walk</h2>
      </div>
      <div className={styles.formBox}>
        <div className={styles.formAndOAuth}>
          <h2>Login</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <label htmlFor='username'>Username:</label>
            <input
              id='username'
              name='username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type='text'
              required
            />
          
            <label htmlFor='password'>Password:</label>
            <input
              id='password'
              name='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type='password'
              required
            />
            <button type='submit'>Login</button>
          </form>
          <div className={styles.oAuth}>
            <p>Or Login Through</p>
            <button onClick={handleGoogleClick}>Google</button>
            <button onClick={handleMicrosoftClick}>Microsoft</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;