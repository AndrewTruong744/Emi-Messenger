import {useState} from 'react';
import styles from "../styles/Settings.module.css";
import { useBoundStore } from "../store/useBoundStore";
import Loading from './sub-components/Loading';
import api from '../helper/axios';

function Settings() {
  const currentUser = useBoundStore(state => state.currentUser);
  const username = currentUser?.username;
  const email = currentUser?.email;

  const [newUsername, setNewUsername] = useState<string | null>(null);

  // implement changing passwords and emails when implementing email verification
  const [newEmail, setNewEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (currentUser?.username !== newUsername && newUsername && newUsername.length > 0) {
      try {
        await api.put("/user/me", {username: newUsername});
      } catch (err) {
        console.log(err);
        setNewUsername(null);
      }
    }
  }

  async function handleSignout() {
    try {
      await api.post("/auth/signout");
      console.log("success!!!");
    } catch (err) {
      console.log(err);
    }
    
  }

  async function handleDeleteAccount() {
    try {
      await api.delete("/general/current-user");
      console.log("success!!!");
    } catch (err) {
      console.log(err);
    }
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
              placeholder={(newEmail) ? newEmail : email}
              onChange={(e) => setNewEmail(e.target.value)}
              type='email'
              disabled={true}
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
              placeholder={(!currentUser.sub) ? "Disabled" : ""}
              onChange={(e) => setNewEmail(e.target.value)}
              type='password'
              disabled={!currentUser || !currentUser.sub}
              required
            />
          </div>

          <button className={styles.updateButton} type='submit'>Update</button>
        </form>

        <div className={styles.divider}></div>
        <button className={styles.signoutButton} onClick={handleSignout}>Sign Out</button>

        <div className={styles.divider}></div>
        <button className={styles.deleteAccountButton} onClick={handleDeleteAccount}>Delete Account</button>
      </div>
  );
}

export default Settings;