import styles from "../../styles/Messages.module.css";
import { useEffect } from "react";
import { useSocket } from "../../helper/store";
import {format} from "date-fns";
import api from "../../helper/axios";
import Loading from "./Loading";
import { useState } from "react";

interface Props {
  otherUser: string
}

function Messages({otherUser} : Props) {
  const updateConversationsAndMessages = useSocket(state => state.updateConversationsAndMessages);
  const messages = useSocket(state => state.conversationsAndMessages?.[otherUser]) || [];

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getMessages() {
      const currentMsgs = useSocket.getState().conversationsAndMessages?.[otherUser] || [];
      if (currentMsgs.length > 0) {
        setIsLoading(false);
        return;
      }

      try {
        const axiosRes = await api.get(`/general/messages/${otherUser}`);
        const messagesObj = axiosRes.data;
        updateConversationsAndMessages(otherUser, messagesObj.messages);
        setIsLoading(false);
        console.log(axiosRes);
      } catch (err) {
        console.log(err);
      }
    }

    getMessages();
  }, [otherUser]);

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