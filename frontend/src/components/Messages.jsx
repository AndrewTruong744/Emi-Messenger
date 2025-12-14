import {useState, useEffect} from 'react';
import {Outlet, useNavigate} from 'react-router-dom'
import styles from "../styles/Messages.module.css";
import Conversation from './Conversation';
import FindPeople from './FindPeople';
import api from '../helper/axios';
import axios from 'axios';

const friends = [
  ["jesus", 1],
  ["christian", 2],
  ["xavior", 3],
  ["david", 4],
  ["priscilla", 5],
  ["andrew", 6],
  ["chris", 7],
  ["enoch", 8],
  ["emi", 9],
  ["william", 10],
  ["cesar", 11],
  ["bryan", 12],
  ["minh", 13],
]

function Messages() { 
  const navigate = useNavigate();

  const [activeMessage, setActiveMessage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  async function getCurrentUser() {
    try {
      const axiosRes = await api.get('/general/current-user');
      const currentUserObj = axiosRes.data;
      setCurrentUser(currentUserObj.currentUser);
    } catch (err) {
      console.log(err);
    }
  }

  async function getConversations() {
    try {
      const axiosRes = await api.get('/general/conversations');
      const conversationsObj = axiosRes.data;
      setConversations(conversationsObj.conversations);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    getCurrentUser();
    getConversations();
  }, []);

  console.log(conversations);
  console.log(currentUser);

  function handleSettings() {
    navigate('settings');
  }

  function handleFindPeople() {
    navigate('find-people');
  }

  function handleFriendSelected(username) {
    navigate(`conversation/${username}`);
  }

  return ( 
    <div className={styles.messages}>
      <div className={styles.title}>
        <h1>Emi Messenger</h1>
        <h2>Welcome User!</h2>
      </div>
      <div className={styles.main}>
        <Outlet context={{onSetActiveMessage: setActiveMessage, getConversations: getConversations}}/>
      </div>
      <div className={styles.sidebar}>
        <div className={styles.friends}>
          <div className={styles.search}>
            <input placeholder="Find Friend" type="text" className={styles.input}/>
            <button className={styles.button} aria-label='find people' onClick={handleFindPeople}>＋</button>
          </div>
          <ul className={styles.friendList}>
            {/* make sure to update when api is implemented */}
            {conversations.map(conversation => {
              return (
                <li 
                  key={conversation.username} 
                  className={styles.friend} 
                  id={conversation.username} 
                  onClick={() => handleFriendSelected(conversation.username)}
                >
                  {/* change to image when implemented */}
                  <div className={styles.profileImage}></div>
                  <h3>{conversation.username}</h3>
                  <p className={styles.recentMessage}>Most Recent Text Message</p>
                  <p className={styles.recentMessageTime}>2min</p>
                </li>
              );
            })}
          </ul>
        </div>
        <div className={styles.config}>
          {/* change to image when implemented */}
          <div className={styles.profile}>
            <div className={styles.yourProfileImage}></div>
            {(currentUser) ? <h2>{currentUser.username}</h2> : <h2>Loading</h2>}
          </div>
          <button className={styles.settings} onClick={handleSettings}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.gear}>
              <title>cog</title>
              <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Messages;