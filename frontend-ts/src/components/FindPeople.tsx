import {useState, useEffect} from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import styles from "../styles/FindPeople.module.css";
import api from '../helper/axios';
import { useSocket } from '../helper/store';
import { type Context } from "../types/Context";

interface Users {
  id: string,
  username: string
}

function FindPeople() {
  const navigate = useNavigate();
  const updateConversationsAndMessages = useSocket(state => state.updateConversationsAndMessages);
  const currentUser = useSocket(state => state.currentUser);

  const context = useOutletContext<Context>();
  const {onSetActiveMessage} = context;

  const [users, setUsers] = useState<Users[]>([]);
  const [username, setUsername] = useState('');

  const [userIdsSelected, setUserIdsSelected] = useState<string[]>([]);
  const [usernamesSelected, setUsernamesSelected] = useState<string[]>([]);

  useEffect(() => {
    async function getUsers() {
      try {
        const axiosRes = await api.get('/general/users');
        const usersObj = axiosRes.data;
        setUsers(usersObj.users);

        // if (currentUser) {
        //   setUserIdsSelected([currentUser.id]);
        //   setUsernamesSelected([currentUser.username]);
        // }

        console.log(usersObj);
      } catch (err) {
        console.log('API fetch failed ' + err);
        setUsers([]);
      }
    }

    getUsers();
  }, [currentUser]);

  async function handleFindUser(e : React.KeyboardEvent<HTMLInputElement>) {
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

  async function handleUserClicked(e : React.MouseEvent<HTMLLIElement>) {
    try {
      await api.put(`general/conversation/`, {
        userIds: [currentUser?.id, e.currentTarget.id], 
        usernames: [currentUser?.username, e.currentTarget.querySelector('h3')!.textContent]
      });
      updateConversationsAndMessages(e.currentTarget.id, null);
      onSetActiveMessage(e.currentTarget.id);
      navigate(`/home/conversation/${e.currentTarget.id}`);
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
            <li 
              key={user.id} 
              id={user.id}  
              className={styles.person} 
              onClick={handleUserClicked}
            >
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