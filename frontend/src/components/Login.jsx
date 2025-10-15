import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from "../styles/Login.module.css";
import api from '../helper/axios.js';
import {useAuth} from '../helper/store.js';

function Login() {
  const authSuccess = useAuth((state) => state.authSuccess);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  //const [message, setMessage] = useState('');
  //implement this later
  //const [isLoading, setIsLoading] = useState(true);

  async function handleSubmit(e) {
    e.preventDefault();

    const loginData = {
      username: username,
      password: password
    }

    try {
      const res = await api.post('/login', loginData);
      const accessToken = res.data.accessToken;
      console.log('Login successful!', res.data);
      authSuccess(accessToken);
      
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
    <form onSubmit={handleSubmit}>
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

      <button type='submit'>Submit</button>
    </form>
  );
}

export default Login;