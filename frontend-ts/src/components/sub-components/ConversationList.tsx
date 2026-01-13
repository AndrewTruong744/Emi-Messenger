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
  const conversationList = useSocket(state => state.conversationList);
  const currentUser = useSocket(state => state.currentUser);

  const isLoading = (conversationList) ? false : true;

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

  return (
    <div className={styles.conversations}>
      <div className={styles.search}>
        <input placeholder="Find Conversation" type="text" className={styles.input}/>
        <button className={styles.button} aria-label='find people' onClick={handleFindPeople}>＋</button>
      </div>
      {(isLoading) ? <Loading /> : 
        <ul className={styles.conversationList}>
          {
            Object.values(conversationList ?? {}).map(conversation => {
              console.log(currentUser);

              return (
                <li 
                  key={conversation.id} 
                  className={
                    `${styles.conversation} ${(conversation.id === activeMessage) ? 
                      styles.conversationHighlight : ""}`
                  } 
                  id={conversation.id} 
                  onClick={() => handleConversationSelected(conversation.id)}
                >
                  {/* change to image when implemented */}
                  <div className={styles.profileImage}>
                    <div className={
                      `${styles.indicator} ${(conversation.online) ? 
                        styles.onlineIndicator : ""}`
                    }>
                    </div>
                  </div>
                  <h3 className={styles.name}>{conversation.name}</h3>
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