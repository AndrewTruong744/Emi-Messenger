import {create} from 'zustand';
import {io, Socket} from 'socket.io-client';
import { type NavigateFunction } from 'react-router-dom';
import useLogin from './loginStore';
import useClear from './clearStore';

interface User {
  id: string,
  online: boolean,
  username: string,
  email: string,
  sub: string,
};

interface Conversation {
  isGroup: boolean,
  online: boolean,
  recentMessage: string | null,
  timeStamp: string,
  participants: string[],
  participantNames?: string[],
  id: string,
  name: string,
}

interface Message {
  id: string,
  sent: string,
  content: string,
  senderId: string,
  conversationId: string
}

interface UuidToUsername {
  [key : string] : string
}

interface ConversationsAndMessages {
  [key : string]: Message[] | null
}

interface UserSocket {
  currentUser: User | null,
  socket: Socket | null,
  uuidToUsername : UuidToUsername | null,
  conversationList : {[conversationId : string]: Conversation} | null,
  conversationsAndMessages: ConversationsAndMessages | null,
  setCurrentUser: (currentUser : User) => void,
  connect: (navigate : NavigateFunction) => void,
  disconnect: () => void,
  setConversationsAndMessages: (
    conversationList : Conversation[], 
    userIdToUsernames : Record<string,string>
  ) => void,
  updateConversationsAndMessages: (messages : Message[], conversationId : string) => void,
  clearStore: () => void,
}

const useSocket = create<UserSocket>()((set, get) => ({
  currentUser: null,
  socket: null,
  uuidToUsername: null,
  conversationList : null,
  conversationsAndMessages: null,
  setCurrentUser: (currentUser) => {
    set({currentUser});
  },
  connect: (navigate) => {
    if (get().socket != null)
      return;

    const socket = io(import.meta.env.VITE_API_DOMAIN, {withCredentials: true});

    socket.on('userOnline', (conversationId) => {
      
      set((state) => {
        const currConversation = state.conversationList?.[conversationId];
        // issue with isGroup saving
        if (currConversation && currConversation.participants.length === 2) {
          return {
            conversationList: {
              ...state.conversationList,
              [conversationId]: {
                ...state.conversationList![conversationId],
                online: true,
              }
            }
          };
        }
        else {
          return {};
        }
      })
    });

    socket.on('userOffline', (conversationId) => {
      set((state) => {
        const currConversation = state.conversationList?.[conversationId];
        if (currConversation && currConversation.participants.length === 2) {
          return {
            conversationList: {
              ...state.conversationList,
              [conversationId]: {
                ...state.conversationList![conversationId],
                online: false,
              }
            }
          };
        }
        else {
          return {};
        }
      });
    });

    socket.on('usernameChange', (data) => {
      const currentUser = get().currentUser;
      if (currentUser && data.userId === currentUser.id) {
        set(state => ({
          currentUser: {
            ...state.currentUser!,
            username: data.username
          }
        }));
      }
      else {
        set(state => {
          if (state.uuidToUsername !== null) {
            return {
              uuidToUsername: {
                ...state.uuidToUsername,
                [data.userId]: data.username
              }
            }
          }
          else
            return state;
        });
      }
    });

    // convert to array and sort based on timeStamp in ConversationList.tsx
    socket.on("sentMessage", (sentMessage : Message) => {
      const conversationId = sentMessage.conversationId;

      set((state) => ({
        conversationsAndMessages: {
          ...state.conversationsAndMessages,
          [conversationId]: [
            ...((state.conversationsAndMessages as ConversationsAndMessages)[conversationId] ?? []),
            sentMessage
          ]
        },
        conversationList: {
          ...state.conversationList,
          [conversationId]: {
            ...state.conversationList![conversationId],
            recentMessage: sentMessage.content,
            timeStamp: sentMessage.sent
          }
        }
      }));
    })

    socket.on("addConversation", (conversation : Conversation) => {
      console.log(conversation);
      const participants = conversation.participants.reduce((acc, participant, index) => {
        acc[participant] = conversation.participantNames![index];
        return acc;
      }, {} as Record<string,string>);

      set((state) => ({
        uuidToUsername: {
          ...state.uuidToUsername,
          ...participants
        },
        conversationsAndMessages: {
          ...state.conversationsAndMessages,
          [conversation.id]: [],
        },
        conversationList: {
          ...state.conversationList,
          [conversation.id]: conversation
        }
      }));
    });

    socket.on("conversationNameChange", (data : {
      conversationId : string,
      name: string
    }) => {
      console.log("newConversationData!!!: " + data)
      set(state => {
        if (!state.conversationList?.[data.conversationId])
          return state;

        return {
          conversationList: {
            ...state.conversationList,
            [data.conversationId]: {
              ...state.conversationList[data.conversationId],
              name: data.name
            }
          }
        }
      })
    });

    socket.on("signout", () => {
      const setLoginMessage = useLogin.getState().setLoginMessage;
      setLoginMessage('Signed Out');
      navigate('/login');
      
      useClear.getState().clearStore();
    });

    socket.on("conversationDeleted", (conversationId : string) => {
      if (window.location.href.includes(conversationId))
        navigate('/home');
      console.log(conversationId);
      console.log(window.location.href);
      // find a way to cleanly remove the username and id
      set((state) => {
        const {[conversationId]: removedConversationAndMessage, ...newConversationAndMessages} 
          = state.conversationsAndMessages || {};
        const {[conversationId]: removedConversation, ...newConversationList} 
          = state.conversationList || {};

        return {
          conversationsAndMessages: newConversationAndMessages,
          conversationList: newConversationList
        };
      });
    });

    socket.on("accountDeleted", () => {
      const setLoginMessage = useLogin.getState().setLoginMessage;
      setLoginMessage('Account Deleted');
      navigate('/login');

      useClear.getState().clearStore();
    });

    set({socket});
  },
  disconnect: () => {
    const socket = get().socket;
    if (socket)
      socket.disconnect();
    useClear.getState().clearStore();
  },
  //change group naming
  setConversationsAndMessages: (conversationList : Conversation[], userIdToUsernames : Record<string,string>) => {
    set((state) => {
      const newUuidToUsername = { ...state.uuidToUsername };
      const newConversationList = {...state.conversationList};

      console.log(conversationList);
      conversationList.forEach((conversation) => {
        newConversationList[conversation.id] = conversation;
      });
      console.log(newConversationList);

      Object.entries(userIdToUsernames).forEach((userIdToUsername) => {
        newUuidToUsername[userIdToUsername[0]] = userIdToUsername[1];
      });

      return {
        uuidToUsername: newUuidToUsername,
        conversationList: newConversationList,
      };
    });
  },
  updateConversationsAndMessages: (messages, conversationId) => {
    set((state) => {
      if (messages.length === 0) {
        return {
          conversationsAndMessages: {
          ...state.conversationsAndMessages,
          [conversationId]: [],
        }
        }
      }

      let updatedMessages = messages;
      const currentMessages = state.conversationsAndMessages?.[messages[0].conversationId]
      if (currentMessages) {
        const currentIds = new Set(currentMessages.map(message => message.id));
        updatedMessages = updatedMessages.filter(message => !currentIds.has(message.id));
        updatedMessages = [...updatedMessages, ...currentMessages];
      }

      return {
        conversationsAndMessages: {
          ...state.conversationsAndMessages,
          [conversationId]: updatedMessages,
        }
      };
    });
  },
  clearStore: () => {
    set({
      currentUser: null,
      socket: null,
      uuidToUsername: null,
      conversationList: null,
      conversationsAndMessages: null,
    });
  }
}));

export {useSocket, type Conversation};