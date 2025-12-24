import styles from "../styles/Conversation.module.css";
import { useParams } from 'react-router-dom';
import MessageHeader from './sub-components/MessageHeader';
import Messages from './sub-components/Messages';
import MessageBox from './sub-components/MessageBox';

function Conversation() {
  const params = useParams();
  const otherUser = params.user;

  return (
    <main className={styles.conversation}>
      <MessageHeader otherUser={otherUser}/>
      <Messages otherUser={otherUser}/>
      <MessageBox otherUser={otherUser}/>
    </main>
  );
}

export default Conversation;