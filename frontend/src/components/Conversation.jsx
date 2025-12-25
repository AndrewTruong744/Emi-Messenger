import styles from "../styles/Conversation.module.css";
import { useParams, useOutletContext } from 'react-router-dom';
import MessageHeader from './sub-components/MessageHeader';
import Messages from './sub-components/Messages';
import MessageBox from './sub-components/MessageBox';
import { useEffect } from "react";

function Conversation() {
  const params = useParams();
  const otherUser = params.user;

  const context = useOutletContext();
  const {onSetActiveMessage} = context;

  useEffect(() => {
    onSetActiveMessage(otherUser);
  }, [otherUser, onSetActiveMessage]);

  useEffect(() => {
    return () => {
      onSetActiveMessage(null);
    }
  }, [onSetActiveMessage])

  return (
    <main className={styles.conversation}>
      <MessageHeader otherUser={otherUser}/>
      <Messages otherUser={otherUser}/>
      <MessageBox otherUser={otherUser}/>
    </main>
  );
}

export default Conversation;