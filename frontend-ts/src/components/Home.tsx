import {useState, useEffect} from 'react';
import {Outlet} from 'react-router-dom'
import styles from "../styles/Home.module.css";
import api from '../helper/axios';
import { useNavigate } from 'react-router-dom';
import { useBoundStore } from "../store/useBoundStore";
import ConversationList from './sub-components/ConversationList';
import ProfileCard from './sub-components/ProfileCard';
import GreetingBox from './sub-components/GreetingBox';
import useIsMobile from '../helper/mobile';

function Home() { 
  const navigate = useNavigate();
  const setCurrentUser = useBoundStore(state => state.setCurrentUser);
  const connect = useBoundStore(state => state.connect);
  const disconnect = useBoundStore(state => state.disconnect);
  const setConversations = useBoundStore(state => state.setConversations);
  const [atHome, isMobile] = useIsMobile();

  // holds uuid of conversation you are chatting on
  const [activeMessage, setActiveMessage] = useState<string | null | undefined>(null);

  useEffect(() => {

    async function getCurrentUser() {
      const axiosRes = await api.get('/users/me');
      const currentUserObj = axiosRes.data;
      setCurrentUser(currentUserObj.currentUser);
    }

    async function getConversations() {
      const axiosRes = await api.get('/conversations');
      const conversationsObj = axiosRes.data;
      setConversations(conversationsObj.conversationList, conversationsObj.userIdToUsernames);
      console.log(conversationsObj);
    }

    async function initialize() {
      try {
        await getCurrentUser();
        await getConversations();
        connect(navigate);
      } catch (err) {
        console.log(err);
      }
    }

    initialize();
    return () => {
      disconnect();
    };
  }, [connect, disconnect, setConversations, setCurrentUser, navigate]);

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