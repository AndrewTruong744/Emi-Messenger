import styles from "../../styles/ConversationList.module.css";
import { useBoundStore } from "../../store/useBoundStore";
import { type Conversation } from "../../types/storeTypes";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface Props {
  activeMessage: string | null | undefined,
  onSetActiveMessage: React.Dispatch<React.SetStateAction<string | null | undefined>>
}

function ConversationList({activeMessage, onSetActiveMessage} : Props) {
  const navigate = useNavigate();
  const conversationListObj = useBoundStore(state => state.conversationList);
  const uuidToUsername = useBoundStore(state => state.uuidToUsername);
  const currentUser = useBoundStore(state => state.currentUser);
  const isLoading = (conversationListObj) ? false : true;

  const [findConversation, setFindConversation] = useState("");

  let sortedConversationList : Conversation[] = [];
  if (conversationListObj) {
    sortedConversationList = Object.values(conversationListObj);
    sortedConversationList = sortedConversationList.filter(conversation => {
      return conversation.name.toLowerCase().includes(findConversation.toLowerCase());
    }).sort((a,b) => {
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
        <input 
          placeholder="Find Conversation" 
          type="text" 
          className={styles.input}
          onChange={(e) => setFindConversation(e.currentTarget.value)}
        />
        <button className={styles.button} aria-label='find people' onClick={handleFindPeople}>＋</button>
      </div>
      {(isLoading) ? <Loading /> : 
        <ul className={styles.conversationList}>
          {
            sortedConversationList.map(conversation => {
              let conversationName = conversation?.name ?? "Loading";
              if (conversationName === "" && conversation && uuidToUsername && currentUser) {
                conversationName = conversation.participants
                  .filter(participantId => participantId != currentUser.id)
                  .map(participantId => uuidToUsername[participantId])
                  .join(', ');
              }

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
                  <h3 className={styles.name}>{conversationName}</h3>
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