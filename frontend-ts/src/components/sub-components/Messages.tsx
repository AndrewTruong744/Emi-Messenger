import styles from "../../styles/Messages.module.css";
import { useEffect } from "react";
import { useSocket } from "../../helper/store";
import {format} from "date-fns";
import api from "../../helper/axios";
import Loading from "./Loading";
import { useState } from "react";

interface Props {
  otherUserId: string
}

function Messages({otherUserId} : Props) {
  console.log(otherUserId);
  const updateConversationsAndMessages = useSocket(state => state.updateConversationsAndMessages);
  const messages = useSocket(state => state.conversationsAndMessages?.[otherUserId]) || [];

  const [isLoading, setIsLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);

  useEffect(() => {
    async function getMessages() {
      if (isLoading) {
        try {
          const axiosRes = await api.get(`/general/messages/${otherUserId}`);
          const messagesObj = axiosRes.data;

          updateConversationsAndMessages(otherUserId, messagesObj.messages);
          setIsLoading(false);
          console.log(axiosRes);
        } catch (err) {
          console.log(err);
          setUserNotFound(true);
        }
      }
    }

    getMessages();
  }, [otherUserId]);

  console.log(messages);
  console.log(userNotFound);

  return (
    (isLoading) ? <Loading /> : 
      <div className={styles.texts}>
        {messages.map(message => {
          const formattedTimeStamp = format(message.sent, 'HH:mm MM/dd/yyyy');
          const className = (message.from === "sender") ? "textRight" : "textLeft";

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