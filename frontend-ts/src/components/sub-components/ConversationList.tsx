import styles from "../../styles/ConversationList.module.css";
import { useSocket } from "../../helper/store";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";
import { formatDistanceToNow } from "date-fns";

interface Props {
  activeMessage: string | null | undefined,
  onSetActiveMessage: React.Dispatch<React.SetStateAction<string | null | undefined>>
}

function ConversationList({activeMessage, onSetActiveMessage} : Props) {
  const navigate = useNavigate();
  const conversationList = useSocket(state => state.conversationList);
  const currentUser = useSocket(state => state.currentUser);

  const isLoading = (conversationList) ? false : true;

  function formatTimeShort(date : string) {
    const formattedTime = formatDistanceToNow(new Date(date));

    return formattedTime
    .replace('about ', '')
    .replace('less than a minute', '1m')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' months', 'mo')
    .replace(' month', 'mo')
    .replace(' years', 'y')
    .replace(' year', 'y');
  }

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
              console.log(conversation);
              console.log(conversation.timeStamp);

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
                      `${(conversation.isGroup) ? "" : styles.indicator} ${(conversation.online) ? 
                        styles.onlineIndicator : ""}`
                    }>
                    </div>
                  </div>
                  <h3 className={styles.name}>{conversation.name}</h3>
                  <p className={styles.recentMessage}>
                    {(conversation.recentMessage) ? conversation.recentMessage : ""}
                  </p>
                  <p className={styles.recentMessageTime}>
                    {(conversation.timeStamp) ? formatTimeShort(conversation.timeStamp) : '--'}
                  </p>
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