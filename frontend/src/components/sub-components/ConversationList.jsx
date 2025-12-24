import styles from "../../styles/ConversationList.module.css";
import { useSocket } from "../../helper/store";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Loading from "./Loading";

function ConversationList() {
  const navigate = useNavigate();
  const conversationsAndMessages = useSocket(state => state.conversationsAndMessages);
  const socket = useSocket(state => state.socket);

  const isLoading = (socket) ? false : true;

  function handleFindPeople() {
    navigate('find-people');
  }

  function handleConversationSelected(username) {
    navigate(`conversation/${username}`);
  }

  return (
    <div className={styles.conversations}>
      <div className={styles.search}>
        <input placeholder="Find Conversation" type="text" className={styles.input}/>
        <button className={styles.button} aria-label='find people' onClick={handleFindPeople}>＋</button>
      </div>
      {(isLoading) ? <Loading /> : 
        <ul className={styles.conversationList}>
          {
            Object.keys(conversationsAndMessages).map(username => {
              return (
                <li 
                  key={username} 
                  className={styles.conversation} 
                  id={username} 
                  onClick={() => handleConversationSelected(username)}
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
      }
    </div>
  )
}

export default ConversationList;