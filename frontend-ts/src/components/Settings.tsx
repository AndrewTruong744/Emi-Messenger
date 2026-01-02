import {useState, useEffect} from 'react';
import styles from "../styles/Settings.module.css";

function Settings() {
  

  return (
    <div className={styles.settings}>
      <h1 className={styles.title}>Settings!</h1>
      {/* <div>
        <div></div>
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
      </div> */}
    </div>
  );
}

export default Settings;