import {useState, useEffect} from 'react';
import {Outlet, useNavigate} from 'react-router-dom'
import styles from "../styles/Home.module.css";
import api from '../helper/axios';
import { useSocket } from '../helper/store';
import ConversationList from './sub-components/ConversationList';
import ProfileCard from './sub-components/ProfileCard';

function Home() { 
  const setCurrentUser = useSocket(state => state.setCurrentUser);
  const connect = useSocket(state => state.connect);
  const disconnect = useSocket(state => state.disconnect);
  const setConversationsAndMessages = useSocket(state => state.setConversationsAndMessages);

  // holds uuid of person you are chatting with
  const [activeMessage, setActiveMessage] = useState(null);

  useEffect(() => {
    async function getCurrentUser() {
      try {
        const axiosRes = await api.get('/general/current-user');
        const currentUserObj = axiosRes.data;
        setCurrentUser(currentUserObj.currentUser);
      } catch (err) {
        throw new Error(err);
      }
    }

    async function getConversations() {
      try {
        const axiosRes = await api.get('/general/conversations');
        const conversationsObj = axiosRes.data;
        setConversationsAndMessages(conversationsObj.conversations);
      } catch (err) {
        throw new Error(err);
      }
    }

    async function initialize() {
      try {
        await getCurrentUser();
        await getConversations();
        await connect();
      } catch (err) {
        console.log(err);
      }
    }

    initialize();
    return () => disconnect();
  }, [connect, disconnect, setConversationsAndMessages, setCurrentUser]);

  return ( 
    <div className={styles.home}>
      <div className={styles.title}>
        <h1>Emi Messenger</h1>
        <h2>Welcome User!</h2>
      </div>
      <div className={styles.main}>
        <Outlet 
          context={{
            onSetActiveMessage: setActiveMessage, 
          }}
        />
      </div>
      <div className={styles.sidebar}>
        <ConversationList activeMessage={activeMessage} onSetActiveMessage={setActiveMessage}/>
        <ProfileCard />
      </div>
    </div>
  );
}

export default Home;