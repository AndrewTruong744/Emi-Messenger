import { useEffect, useState } from "react";
import api from "../../helper/axios";
import styles from "../../styles/MessageHeader.module.css";
import { useSocket } from "../../helper/store";
import Loading from "./Loading";

interface Props {
  conversationId: string
}

// implement function to delete a conversation
// implement popup that shows users in conversation
// implement overflow control with conversation name
function MessageHeader({conversationId} : Props) {
  const conversation = useSocket((state) => state.conversationList?.[conversationId]);
  const uuidToUsername = useSocket((state) => state.uuidToUsername);
  const currentUser = useSocket((state) => state.currentUser);

  const [newConversationName, setNewConversationName] = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  async function handleDeleteConversation() {
    try {
      await api.delete(`/conversations/${conversationId}`);
    } catch (err) {
      console.log(err);
    }
  }

  async function handleConversationNameChange(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && 
        newConversationName &&
        newConversationName.length > 0 && 
        newConversationName != conversationName &&
        conversation?.isGroup) {
      try {
        await api.put(`conversations/${conversationId}`, {name: newConversationName});
      } catch (err) {
        console.log(err);
      }
    }
  }

  useEffect(() => {
    function resetState() {
      setNewConversationName(null);
    }

    resetState();
  }, [conversationId])
  
  console.log(newConversationName);

  let conversationName = conversation?.name ?? "Loading";
  if (conversationName === "" && conversation && uuidToUsername && currentUser) {
    console.log("ENTEREDD!!!!!")
    conversationName = conversation.participants
      .filter(participantId => participantId != currentUser.id)
      .map(participantId => uuidToUsername[participantId])
      .join(', ');
  }

  console.log(conversationName);

  return (
    <header className={styles.header}>
      <div className={styles.profile}>
        <div className={styles.profileImage}></div>
        <input
          id="conversationName"
          name="conversationName"
          value={(newConversationName === null) ? conversationName : newConversationName}
          className={styles.conversationName}
          spellCheck="false"
          onChange={(e) => setNewConversationName(e.currentTarget.value)}
          onKeyDown={handleConversationNameChange}
          disabled={!conversation?.isGroup}
        />
      </div>
      <div className={styles.buttons}>
        <button className={styles.button} onClick={handleDeleteConversation}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.icon}>
            <title>delete-conversation</title>
            <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M9,8H11V17H9V8M13,8H15V17H13V8Z" />
          </svg>
        </button>
        <button className={styles.button} onClick={() => setShowParticipants(!showParticipants)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.icon}>
            <title>participants</title>
            <path d="M12,16C13.1,16 14,16.9 14,18C14,19.1 13.1,20 12,20C10.9,20 10,19.1 10,18C10,16.9 10.9,16 12,16M12,10C13.1,10 14,10.9 14,12C14,13.1 13.1,14 12,14C10.9,14 10,13.1 10,12C10,10.9 10.9,10 12,10M12,4C13.1,4 14,4.9 14,6C14,7.1 13.1,8 12,8C10.9,8 10,7.1 10,6C10,4.9 10.9,4 12,4M12,5C11.45,5 11,5.45 11,6C11,6.55 11.45,7 12,7C12.55,7 13,6.55 13,6C13,5.45 12.55,5 12,5M12,11C11.45,11 11,11.45 11,12C11,12.55 11.45,13 12,13C12.55,13 13,12.55 13,12C13,11.45 12.55,11 12,11M12,17C11.45,17 11,17.45 11,18C11,18.55 11.45,19 12,19C12.55,19 13,18.55 13,18C13,17.45 12.55,17 12,17Z" />
          </svg>
        </button>
      </div>
      {(showParticipants) ? 
        <div className={styles.participants}>
          <h3 className={styles.participantTitle}>Participants: </h3>
          {(conversation && uuidToUsername) ? 
              conversation.participants.map(participantId => {
                return <div key={participantId} className={styles.participant}>
                  <div className={styles.participantImage}></div> {/* represents profile image */}
                  <p className={styles.participantName}>{uuidToUsername[participantId]}</p>
                </div>
                
              }): <Loading />
          }
        </div> : null
      }
    </header>
  )
}

export default MessageHeader;