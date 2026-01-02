import {useState, useEffect} from 'react';
import {Outlet} from 'react-router-dom'
import styles from "../styles/Home.module.css";
import api from '../helper/axios';
import { useSocket } from '../helper/store';
import ConversationList from './sub-components/ConversationList';
import ProfileCard from './sub-components/ProfileCard';
import GreetingBox from './sub-components/GreetingBox';
import useIsMobile from '../helper/mobile';

function Home() { 
  const setCurrentUser = useSocket(state => state.setCurrentUser);
  const connect = useSocket(state => state.connect);
  const disconnect = useSocket(state => state.disconnect);
  const setConversationsAndMessages = useSocket(state => state.setConversationsAndMessages);
  const [atHome, isMobile] = useIsMobile();

  // holds uuid of person you are chatting with
  const [activeMessage, setActiveMessage] = useState<string | null | undefined>(null);

  useEffect(() => {

    async function getCurrentUser() {
      const axiosRes = await api.get('/general/current-user');
      const currentUserObj = axiosRes.data;
      setCurrentUser(currentUserObj.currentUser);
    }

    async function getConversations() {
      const axiosRes = await api.get('/general/conversations');
      const conversationsObj = axiosRes.data;
      setConversationsAndMessages(conversationsObj.conversations);
    }

    async function initialize() {
      try {
        await getCurrentUser();
        await getConversations();
        connect();
      } catch (err) {
        console.log(err);
      }
    }

    initialize();
    return () => {
      disconnect();
    };
  }, [connect, disconnect, setConversationsAndMessages, setCurrentUser]);

  console.log(atHome);
  console.log(isMobile);

  return ( 
    <div className={styles.home}>
      {(isMobile && !atHome) ? null : <GreetingBox />}
      {(isMobile && atHome) ? null :
        <div className={styles.main}>
          <Outlet 
            context={{
              onSetActiveMessage: setActiveMessage, 
            }}
          />
        </div>
      }
      {(isMobile && !atHome) ? null : 
        <div className={styles.sidebar}>
          <ConversationList activeMessage={activeMessage} onSetActiveMessage={setActiveMessage}/>
          <ProfileCard />
        </div>
      }
    </div>
  );
}

export default Home;