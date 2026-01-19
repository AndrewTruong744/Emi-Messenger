import styles from "../../styles/Messages.module.css";
import { useEffect, useState, useRef, useLayoutEffect, Fragment } from "react";
import { useSocket } from "../../helper/store";
import {format} from "date-fns";
import api from "../../helper/axios";
import Loading from "./Loading";

interface Props {
  conversationId: string
}

// for group chats, show who sent what
// make sure to display Send a message when no messages have been sent
// increase font size of messages with width is large
function Messages({conversationId} : Props) {
  const updateConversationsAndMessages = useSocket(state => state.updateConversationsAndMessages);
  const conversation = useSocket(state => state.conversationList?.[conversationId]);
  const messages = useSocket(state => state.conversationsAndMessages?.[conversationId]);
  const uuidToUsername = useSocket(state => state.uuidToUsername);
  const currentUser = useSocket(state => state.currentUser);

  const [isLoading, setIsLoading] = useState(true);
  const [noMoreMessages, setNoMoreMessages] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const lastScrollHeight = useRef(0);
  const prevMessageId = useRef<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  async function getMessages(scrolledToTop=false) {
    if ((!messages || (scrolledToTop))) {
      try {
        lastScrollHeight.current = messagesRef.current?.scrollHeight || 0;
        setIsLoading(true);
        console.log('prevMessage!!! ' + prevMessageId.current);
        const axiosRes = await api.get(`/general/messages/${conversationId}`, 
          {params: {prevMessageId: prevMessageId.current}});
        const messagesObj = axiosRes.data;
        console.log(messagesObj);

        const length = messagesObj.messages.length;
        if (length > 0) {
          updateConversationsAndMessages(messagesObj.messages, conversationId);
          prevMessageId.current = messagesObj.messages[0].id;
        }

        if (length < 50)
          setNoMoreMessages(true);

        setIsLoading(false);
      } catch (err) {
        console.log(err);
        setUserNotFound(true);
      }
    }
  }

  function handleScroll() {
    if (!messagesRef.current || isLoading || noMoreMessages)
      return;

    if (messagesRef.current.scrollTop === 0) {
      console.log('entered!!!');
      getMessages(true);
    }
  }

  useLayoutEffect(() => {
    if (messagesRef.current && messages) {
      if (lastScrollHeight.current === 0)
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      else {
        const heightDifference = messagesRef.current.scrollHeight - lastScrollHeight.current;
        messagesRef.current.scrollTop = heightDifference;
        lastScrollHeight.current = 0;
      }
    }
  }, [conversationId, messages, currentUser]);

  useEffect(() => {
    prevMessageId.current = (messages) ? messages[0]?.id : null;
    async function execute() {
      if (messages)
        setIsLoading(false);
      setNoMoreMessages(false);
      await getMessages();
    } 

    execute();
  }, [conversationId]); // only fetch messages when user id changes

  return (
    (isLoading || !currentUser || !conversation) ? <Loading /> : 
      <div className={styles.texts} ref={messagesRef} onScroll={handleScroll}>
        {messages && messages.map((message, index) => {
          const formattedTimeStamp = format(message.sent, 'HH:mm MM/dd/yyyy');
          const className = (message.senderId === currentUser?.id) ? "textRight" : "textLeft";
          const prevMessage = messages[index - 1];

          const showUsername = 
            conversation.isGroup && message.senderId != currentUser.id && prevMessage?.senderId !== message.senderId;

          return (
            <div key={message.id} className={styles.textContent}>
              {(showUsername) ?
                <p>{uuidToUsername?.[message.senderId] ?? "Loading"}</p> : null
              }
              <div className={styles[className]}>
                <p>{message.content}</p>
                <p className={styles.time}>{formattedTimeStamp}</p>
              </div>
            </div>
          );
        })}
      </div>
  );
}

export default Messages;