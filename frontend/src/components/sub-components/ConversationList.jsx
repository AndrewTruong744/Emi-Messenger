import styles from "../../styles/ConversationList.module.css";
import {useState, useEffect} from "react";
import { useSocket } from "../../helper/store";
import { useNavigate } from "react-router-dom";

function ConversationList() {
  const navigate = useNavigate();
  const conversationsAndMessages = useSocket(state => state.conversationsAndMessages);

  function handleFindPeople() {
    navigate('find-people');
  }

  function handleFriendSelected(username) {
    navigate(`conversation/${username}`);
  }

  return (
    <div className={styles.friends}>
      <div className={styles.search}>
        <input placeholder="Find Conversation" type="text" className={styles.input}/>
        <button className={styles.button} aria-label='find people' onClick={handleFindPeople}>＋</button>
      </div>
      <ul className={styles.friendList}>
        {
          Object.keys(conversationsAndMessages).map(username => {
            return (
              <li 
                key={username} 
                className={styles.friend} 
                id={username} 
                onClick={() => handleFriendSelected(username)}
              >
                {/* change to image when implemented */}
                <div className={styles.profileImage}></div>
                <h3>{username}</h3>
                <p className={styles.recentMessage}>Most Recent Text Message</p>
                <p className={styles.recentMessageTime}>2min</p>
              </li>
            );
          }) 
        }
      </ul>
    </div>
  )
}

export default ConversationList;