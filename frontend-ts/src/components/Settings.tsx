import {useState, useEffect, use} from 'react';
import styles from "../styles/Settings.module.css";
import { useSocket } from '../helper/store';
import Loading from './sub-components/Loading';

function Settings() {
  const currentUser = useSocket(state => state.currentUser);
  const username = currentUser?.username;
  const email = currentUser?.email;

  const [newUsername, setNewUsername] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [infoChanged, setInfoChanged] = useState(false);

  function handleUpdateProfile() {

  }

  function handleSignout() {

  }

  function handleDeleteAccount() {

  }

  return (
    (!currentUser) ? <Loading /> : 
      <div className={styles.settings}>
        <h1 className={styles.title}>Settings!</h1>
        <form onSubmit={handleUpdateProfile} className={styles.form}>
          <div className={styles.profileImage}></div>

          <div className={styles.labelAndInput}>
            <label htmlFor='newUsername'>Username:</label>
            <input
              className={styles.input}
              id='newUsername'
              name='newUsername'
              value={(newUsername) ? newUsername : username}
              onChange={(e) => setNewUsername(e.target.value)}
              type='text'
              disabled={!currentUser}
              required
            />
          </div>
            
          <div className={styles.labelAndInput}>
            <label htmlFor='newEmail'>Email:</label>
            <input
              className={styles.input}
              id='newEmail'
              name='newEmail'
              value={(newEmail) ? newEmail : email}
              onChange={(e) => setNewEmail(e.target.value)}
              type='email'
              disabled={!currentUser}
              required
            />
          </div>

          <div className={styles.labelAndInput}>
            <label htmlFor='newPassword'>Password:</label>
            <input
              className={styles.input}
              id='newPassword'
              name='newPassword'
              value={newPassword}
              onChange={(e) => setNewEmail(e.target.value)}
              type='password'
              disabled={!currentUser}
              required
            />
          </div>

          <button className={styles.updateButton} type='submit'>Update</button>
        </form>

        <div className={styles.divider}></div>
        <button className={styles.signoutButton}>Sign Out</button>

        <div className={styles.divider}></div>
        <button className={styles.deleteAccountButton}>Delete Account</button>
      </div>
  );
}

export default Settings;