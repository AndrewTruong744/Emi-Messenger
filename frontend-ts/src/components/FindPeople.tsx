import {useState, useEffect} from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import styles from "../styles/FindPeople.module.css";
import api from '../helper/axios';
import { useBoundStore } from "../store/useBoundStore";
import { type Context } from "../types/Context";

interface Users {
  id: string,
  username: string
}

// TODO: add a refresh button
function FindPeople() {
  const navigate = useNavigate();
  const currentUser = useBoundStore(state => state.currentUser);

  const context = useOutletContext<Context>();
  const {onSetActiveMessage} = context;

  const [users, setUsers] = useState<Users[]>([]);
  const [username, setUsername] = useState('');

  const [userIdsSelected, setUserIdsSelected] = useState<string[]>([]);
  const [usernamesSelected, setUsernamesSelected] = useState<string[]>([]);

  useEffect(() => {
    async function getUsers() {
      try {
        const axiosRes = await api.get('/users');
        const usersObj = axiosRes.data;
        setUsers(usersObj.users);

        if (currentUser) {
          setUserIdsSelected([currentUser.id]);
          setUsernamesSelected([currentUser.username]);
        }

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
        const axiosRes = await api.get(`/users/${username}`);
        const usersObj = axiosRes.data;
        setUsers(usersObj.users);
      } catch (err) {
        console.log(err);
      }
    }
  }

  async function handleUserSelected(e : React.MouseEvent<HTMLLIElement>) {
    const targetId = e.currentTarget.id;
    const targetUsername = e.currentTarget.querySelector('h3')!.textContent;

    if (userIdsSelected.includes(targetId)) {
      const newUserIdsSelected = [...userIdsSelected].filter(userId => userId != targetId);
      const newUsernamessSelected = [...usernamesSelected].filter(username => username != targetUsername);
      setUserIdsSelected(newUserIdsSelected);
      setUsernamesSelected(newUsernamessSelected);
    }
    else {
      setUserIdsSelected([...userIdsSelected, targetId]);
      setUsernamesSelected([...usernamesSelected, targetUsername]);
    }
  }

  async function handleUserClicked() {
    try {
      const axiosRes = await api.post(`/conversations`, {
        userIds: userIdsSelected, 
        usernames: usernamesSelected
      });
      onSetActiveMessage(axiosRes.data.conversationId);
      navigate(`/home/conversation/${axiosRes.data.conversationId}`);
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
          if (user.id === currentUser?.id)
            return null;

          return (
            <li 
              key={user.id} 
              id={user.id}  
              className={
                `${styles.person} 
                ${(userIdsSelected.filter(userId => userId != currentUser?.id).includes(user.id) 
                  ? styles.personHighlight : "")}`
              } 
              onClick={handleUserSelected}
            >
              {/* update to get profile pic */}
              <div className={styles.profileImage}></div>
              <h3 className={styles.name}>{user.username}</h3>
            </li>
          );
        })}
      </ul>
      <div className={`${(userIdsSelected.length >= 2) ? styles.displaySelected : styles.displaySelectedHidden}`}>
        <p>
          <span className={styles.usersSelectedTitle}>Users Selected: {" "}</span>
          {usernamesSelected.map((username, index) => {
            if (index === 0)
              return null;

            return <span key={username}>{(index === 1) ? username : ', ' + username}</span>
          })}
        </p>
        <button onClick={handleUserClicked} className={styles.createConversation}>Create Conversation</button>
      </div>
    </main>
  );
}

export default FindPeople;