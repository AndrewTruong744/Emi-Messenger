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
      const senderId = sentMessage.sender.id;
      const receiverId = sentMessage.receiver.id;

      let key = "";
      if (get().currentUser.id === receiverId) {
        key = senderId;
        sentMessage.from = "receiver";
      }
      else {
        key = receiverId;
        sentMessage.from = "sender";
      }

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

    socket.on("addContact", (users) => {
      const userA = users.userA;
      const userB = users.userB;

      const userToAdd = (get().currentUser.id === userA) ? userB : userA;

      set((state) => ({
        conversationsAndMessages: {
          ...state.conversationsAndMessages,
          [userToAdd]: [],
        }
      }));
    });

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
      const key = conversation.id;
      acc[key] = [];
      return acc;
    }, {});

    set({conversationsAndMessages: initialCache});
  },
  updateConversationsAndMessages: (id, messages) => {
    const newMessages = messages || [];

    set((state) => ({
      conversationsAndMessages: {
        ...state.conversationsAndMessages,
        [id]: newMessages,
      }
    }));
  },
}));

export {useSocket};