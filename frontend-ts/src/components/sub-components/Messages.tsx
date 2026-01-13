import styles from "../../styles/Messages.module.css";
import { useEffect } from "react";
import { useSocket } from "../../helper/store";
import {format} from "date-fns";
import api from "../../helper/axios";
import Loading from "./Loading";
import { useState } from "react";

interface Props {
  conversationId: string
}

// for group chats, show who sent what
function Messages({conversationId} : Props) {
  console.log(conversationId);
  const updateConversationsAndMessages = useSocket(state => state.updateConversationsAndMessages);
  const messages = useSocket(state => state.conversationsAndMessages?.[conversationId]);
  const currentUser = useSocket(state => state.currentUser);

  const [isLoading, setIsLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);

  useEffect(() => {
    async function getMessages() {
      if (messages === null && isLoading) {
        try {
          const axiosRes = await api.get(`/general/messages/${conversationId}`);
          const messagesObj = axiosRes.data;
          console.log(messagesObj);
          if (messagesObj.messages.length > 0)
            updateConversationsAndMessages(messagesObj.messages);
          setIsLoading(false);
          console.log(axiosRes);
        } catch (err) {
          console.log(err);
          setUserNotFound(true);
        }
      }
      else if (messages !== undefined) {
        setIsLoading(false);
      }
    }

    getMessages();
  }, [conversationId, messages]); // only fetch messages when user id changes

  console.log(messages);

  return (
    (isLoading) ? <Loading /> : 
      <div className={styles.texts}>
        {messages && messages.map(message => {
          const formattedTimeStamp = format(message.sent, 'HH:mm MM/dd/yyyy');
          const className = (message.senderId === currentUser?.id) ? "textRight" : "textLeft";

          return (
            <div key={message.id} className={styles[className]}>
              <p>{message.content}</p>
              <p className={styles.time}>{formattedTimeStamp}</p>
            </div>
          );
        })}
      </div>
  );
}

export default Messages;