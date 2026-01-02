import styles from "../../styles/ConversationList.module.css";
import { useSocket } from "../../helper/store";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";

interface Props {
  activeMessage: string | null | undefined,
  onSetActiveMessage: React.Dispatch<React.SetStateAction<string | null | undefined>>
}

function ConversationList({activeMessage, onSetActiveMessage} : Props) {
  const navigate = useNavigate();
  const uuidToUsername = useSocket(state => state.uuidToUsername);

  const isLoading = (uuidToUsername) ? false : true;
  console.log(uuidToUsername);

  function handleFindPeople() {
    navigate('find-people');
  }

  function handleConversationSelected(id : string) {
    if (id === activeMessage) {
      onSetActiveMessage(null);
      navigate('/home');
    }
    else
      navigate(`conversation/${id}`);
  }

  console.log(activeMessage);

  return (
    <div className={styles.conversations}>
      <div className={styles.search}>
        <input placeholder="Find Conversation" type="text" className={styles.input}/>
        <button className={styles.button} aria-label='find people' onClick={handleFindPeople}>＋</button>
      </div>
      {(isLoading) ? <Loading /> : 
        <ul className={styles.conversationList}>
          {
            Object.keys(uuidToUsername ?? {}).map(id => {
              const username = uuidToUsername![id];
              return (
                <li 
                  key={id} 
                  className={`${styles.conversation} ${(id === activeMessage) ? styles.conversationHighlight : ""}`} 
                  id={id} 
                  onClick={() => handleConversationSelected(id)}
                >
                  {/* change to image when implemented */}
                  <div className={styles.profileImage}></div>
                  <h3 className={styles.name}>{username}</h3>
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