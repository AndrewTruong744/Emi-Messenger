import {useState, useEffect} from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import styles from "../styles/FindPeople.module.css";
import api from '../helper/axios';
import { useSocket } from '../helper/store';

function FindPeople() {
  const navigate = useNavigate();
  const updateConversationsAndMessages = useSocket(state => state.updateConversationsAndMessages);

  const context = useOutletContext();
  const {onSetActiveMessage} = context;

  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');

  useEffect(() => {
    async function getUsers() {
      try {
        const axiosRes = await api.get('/general/users');
        const usersObj = axiosRes.data;
        setUsers(usersObj.users);
        console.log(usersObj);
      } catch (err) {
        console.log('API fetch failed ' + err);
        setUsers([]);
      }
    }

    getUsers();
  }, []);

  async function handleFindUser(e) {
    if (e.key === 'Enter') {
      try {
        const axiosRes = await api.get(`/general/users/${username}`);
        const usersObj = axiosRes.data;
        setUsers(usersObj.users);
      } catch (err) {
        console.log(err);
      }
    }
  }

  async function handleUserClicked(e) {
    try {
      await api.put(`general/conversation/${e.target.id}`, {});
      updateConversationsAndMessages(e.target.id, null);
      onSetActiveMessage(e.target.id);
      navigate(`/messages/conversation/${e.target.id}`);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <main className={styles.findPeople}>
      <h2 className={styles.subTitle}>Find People</h2>
      <input 
        placeholder="Find Person" 
        type="text" 
        className={styles.input}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={handleFindUser}
      />
      <ul className={styles.peopleList}>
        {users.map(user => {
          return (
            <li key={user.username} id={user.username} className={styles.person} onClick={handleUserClicked}>
              {/* update to get profile pic */}
              <div className={styles.profileImage}></div>
              <h3 className={styles.name}>{user.username}</h3>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export default FindPeople;