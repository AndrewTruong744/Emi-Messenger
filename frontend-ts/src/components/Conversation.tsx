import styles from "../styles/Conversation.module.css";
import { useParams, useOutletContext } from 'react-router-dom';
import MessageHeader from './sub-components/MessageHeader';
import Messages from './sub-components/Messages';
import MessageBox from './sub-components/MessageBox';
import { useEffect } from "react";
import { type Context } from "../types/Context";

function Conversation() {
  const params = useParams();
  const conversationId = (params.id) ? params.id : "";

  const context = useOutletContext<Context>();
  const {onSetActiveMessage} = context;

  useEffect(() => {
    onSetActiveMessage(conversationId);
  }, [conversationId, onSetActiveMessage]);

  useEffect(() => {
    return () => {
      onSetActiveMessage(null);
    }
  }, [onSetActiveMessage])

  return (
    <main className={styles.conversation}>
      <MessageHeader conversationId={conversationId}/>
      <Messages conversationId={conversationId}/>
      <MessageBox conversationId={conversationId}/>
    </main>
  );
}

export default Conversation;