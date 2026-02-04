import styles from "../../styles/Messages.module.css";
import { useEffect, useState, useRef, useLayoutEffect} from "react";
import { useBoundStore } from "../../store/useBoundStore";
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
  const updateConversationsAndMessages = useBoundStore(state => state.updateConversationsAndMessages);
  const conversation = useBoundStore(state => state.conversationList?.[conversationId]);
  const messages = useBoundStore(state => state.conversationsAndMessages?.[conversationId]);
  const uuidToUsername = useBoundStore(state => state.uuidToUsername);
  const currentUser = useBoundStore(state => state.currentUser);

  const [isLoading, setIsLoading] = useState(true);
  const [noMoreMessages, setNoMoreMessages] = useState(false);
  // const [userNotFound, setUserNotFound] = useState(false);
  const lastScrollHeight = useRef(0);
  const prevMessageId = useRef<string | null>(null); // used for cursor pagination
  const messagesRef = useRef<HTMLDivElement>(null); 

  async function getMessages(scrolledToTop=false) {
    if ((!messages || (scrolledToTop))) {
      try {
        // get current scroll height to be able to correctly position scrollbar when new messages come in
        lastScrollHeight.current = messagesRef.current?.scrollHeight || 0;
        setIsLoading(true);
        const axiosRes = await api.get(`/messages/${conversationId}`, 
          {params: {prevMessageId: prevMessageId.current}});
        const messagesObj = axiosRes.data;
        console.log(messagesObj);

        const length = messagesObj.messages.length;
        if (length > 0) {
          updateConversationsAndMessages(messagesObj.messages, conversationId);
          prevMessageId.current = messagesObj.messages[0].id;
        }

        // we have gotten all messages of this conversation from the database
        if (length < 50)
          setNoMoreMessages(true);

        setIsLoading(false);
      } catch (err) {
        console.log(err);
        // setUserNotFound(true);
      }
    }
  }

  function handleScroll() {
    if (!messagesRef.current || isLoading || noMoreMessages)
      return;

    // if scrollbar is at the top, request for more older messages
    if (messagesRef.current.scrollTop === 0) {
      getMessages(true);
    }
  }

  /* 
    positions scrollbar at the bottom when entering a new conversation and positions it near the
    previously loaded message when more messages are loaded
  */
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

  /*
    reset state when switching to a new conversation since component does not unmount when
    switching to a different conversation
  */
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