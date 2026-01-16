import styles from "../../styles/ConversationList.module.css";
import { useSocket, type Conversation } from "../../helper/store";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";
import { formatDistanceToNow } from "date-fns";

interface Props {
  activeMessage: string | null | undefined,
  onSetActiveMessage: React.Dispatch<React.SetStateAction<string | null | undefined>>
}

// bring most recent conversations on top, sort by timestamp (update redis caching first)
function ConversationList({activeMessage, onSetActiveMessage} : Props) {
  const navigate = useNavigate();
  const conversationListObj = useSocket(state => state.conversationList);
  const isLoading = (conversationListObj) ? false : true;
  const currentUser = useSocket((state) => state.currentUser);

  let sortedConversationList : Conversation[] = [];
  if (conversationListObj) {
    sortedConversationList = Object.values(conversationListObj);
    sortedConversationList.sort((a,b) => {
      return new Date(b.timeStamp).getTime() - new Date(a.timeStamp).getTime();
    })

    console.log(sortedConversationList);
  }

  function formatTimeShort(date : string | number) {
    const formattedTime = formatDistanceToNow(new Date(Number(date)));

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
            sortedConversationList.map(conversation => {

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