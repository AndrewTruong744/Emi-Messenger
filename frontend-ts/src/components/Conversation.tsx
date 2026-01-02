import styles from "../styles/Conversation.module.css";
import { useParams, useOutletContext } from 'react-router-dom';
import MessageHeader from './sub-components/MessageHeader';
import Messages from './sub-components/Messages';
import MessageBox from './sub-components/MessageBox';
import { useEffect } from "react";
import { type Context } from "../types/Context";
import { useSocket } from "../helper/store";

function Conversation() {
  const params = useParams();
  const uuidToUsername = useSocket(state => state.uuidToUsername);
  const otherUserId = (params.user) ? params.user : "";
  const otherUsername = uuidToUsername?.[otherUserId] ?? "Loading";

  const context = useOutletContext<Context>();
  const {onSetActiveMessage} = context;

  useEffect(() => {
    onSetActiveMessage(otherUserId);
  }, [otherUserId, onSetActiveMessage]);

  useEffect(() => {
    return () => {
      onSetActiveMessage(null);
    }
  }, [onSetActiveMessage])

  return (
    <main className={styles.conversation}>
      <MessageHeader otherUsername={otherUsername}/>
      <Messages otherUserId={otherUserId}/>
      <MessageBox otherUserId={otherUserId}/>
    </main>
  );
}

export default Conversation;