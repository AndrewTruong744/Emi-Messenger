import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import api from '../helper/axios.js';
import styles from "../styles/Signup.module.css";

function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');


  async function handleSubmit(e) {
    e.preventDefault();

    const signupData = {
      username,
      password,
      email,
      displayName
    }

    try {
      const res = await api.post('/auth/signup', signupData);
      console.log('Signup successful!', res.data);
      
      navigate('/login');
    } catch (err) {
      if (err.response)
        console.error('Signup Error');
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

      <label htmlFor='email'>Email:</label>
      <input
        id='email'
        name='email'
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        type='email' 
        required 
      />

      <label htmlFor='displayName'>Display Name:</label>
      <input
        id='displayName'
        name='displayName'
        value={displayName} 
        onChange={(e) => setDisplayName(e.target.value)} 
        type='text' 
        required 
      />
      <button type='submit'>Submit</button>
    </form>
  )
}

export default Signup;