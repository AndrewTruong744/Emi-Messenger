import styles from "../../styles/Messages.module.css";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
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
  const messages = useSocket(state => state.conversationsAndMessages?.[conversationId]);
  const currentUser = useSocket(state => state.currentUser);

  const [isLoading, setIsLoading] = useState(true);
  const [noMoreMessages, setNoMoreMessages] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const currMessageId = useRef<string | null>(null);
  const prevMessageId = useRef<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const isFetching = useRef(false);

  async function getMessages() {
    if ((!messages || (messages && !noMoreMessages)) && !isFetching.current) {
      try {
        isFetching.current = true;
        setIsLoading(true);
        console.log('prevMessage!!! ' + prevMessageId.current);
        const axiosRes = await api.get(`/general/messages/${conversationId}`, 
          {params: {prevMessageId: prevMessageId.current}});
        const messagesObj = axiosRes.data;
        console.log(messagesObj);

        const length = messagesObj.messages.length;
        if (length > 0) {
          updateConversationsAndMessages(messagesObj.messages, conversationId);
          currMessageId.current = prevMessageId.current;
          prevMessageId.current = messagesObj.messages[0].id;
        }

        if (length < 50)
          setNoMoreMessages(true);

        setIsLoading(false);
        isFetching.current = false;
      } catch (err) {
        console.log(err);
        setUserNotFound(true);
        isFetching.current = false;
      }
    }
  }

  function handleScroll() {
    if (!messagesRef.current || isLoading || noMoreMessages)
      return;

    if (messagesRef.current.scrollTop === 0) {
      getMessages();
    }
  }

  useLayoutEffect(() => {
    if (messagesRef.current && messages) {
      const scrollPosition = messagesRef.current.scrollTop + messagesRef.current.clientHeight;
      const threshold = messagesRef.current.scrollHeight - 5;
      if (scrollPosition >= threshold)
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      else if (currMessageId.current) {
        const message = document.getElementById(currMessageId.current);
        message?.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }
      else
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [conversationId, messages, currentUser]);

  useEffect(() => {
    prevMessageId.current = (messages) ? messages[0].id : null;
    currMessageId.current = null;
    async function execute() {
      await getMessages();
    } 

    execute();
  }, [conversationId]); // only fetch messages when user id changes

  return (
    (isLoading || !currentUser) ? <Loading /> : 
      <div className={styles.texts} ref={messagesRef} onScroll={handleScroll}>
        {messages && messages.map(message => {
          const formattedTimeStamp = format(message.sent, 'HH:mm MM/dd/yyyy');
          const className = (message.senderId === currentUser?.id) ? "textRight" : "textLeft";

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