import {create} from 'zustand';
import {io} from 'socket.io-client';

const useSocket = create((set, get) => ({
  currentUser: {},
  socket: null,
  conversationsAndMessages: {},
  setCurrentUser: (currentUser) => {
    set({currentUser});
  },
  connect: () => {
    if (get().socket != null)
      return;

    const socket = io(import.meta.env.VITE_API_DOMAIN, {withCredentials: true});

    socket.on("sentMessage", (sentMessage) => {
      const sender = sentMessage.sender.username;
      const receiver = sentMessage.receiver.username;

      const key = (get().currentUser.username == sender) ? receiver : sender;

      set((state) => ({
        conversationsAndMessages: {
          ...state.conversationsAndMessages,
          [key]: [
            ...(state.conversationsAndMessages[key] || []),
            sentMessage
          ]
        }
      }));
    })

    set({socket});
  },
  disconnect: () => {
    set((state) => {
      state.socket?.disconnect();
      return { socket: null };
    });
  },
  setConversationsAndMessages: (conversations) => {
    if (Object.keys(get().conversationsAndMessages).length > 0)
      return;

    const initialCache = conversations.reduce((acc, conversation) => {
      const key = conversation.username;
      acc[key] = [];
      return acc;
    }, {});

    set({conversationsAndMessages: initialCache});
  },
  updateConversationsAndMessages: (username, messages) => {
    const newMessages = messages || [];
    const updatedMessages = [ ...newMessages];

    set((state) => ({
      conversationsAndMessages: {
        ...state.conversationsAndMessages,
        [username]: updatedMessages,
      }
    }));
  },
}));

export {useSocket};