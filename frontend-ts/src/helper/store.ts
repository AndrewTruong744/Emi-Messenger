import {create} from 'zustand';
import {io, Socket} from 'socket.io-client';

interface User {
  id: string,
  username: string,
};

interface Message {
  id: string,
  sent: Date,
  content: string,
  senderId: string,
  receiverId: string,
  from?: string
}

interface ConversationsAndMessages {
  [key : string]: Message[]
}

interface UserSocket {
  currentUser: User | null,
  socket: Socket | null,
  conversationsAndMessages: ConversationsAndMessages | null,
  setCurrentUser: (currentUser : User) => void,
  connect: () => void,
  disconnect: () => void,
  setConversationsAndMessages: (conversations : []) => void,
  updateConversationsAndMessages: (id : string, messages : [] | null) => void
}

const useSocket = create<UserSocket>()((set, get) => ({
  currentUser: null,
  socket: null,
  conversationsAndMessages: null,
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
      if ((get().currentUser as User).id === receiverId) {
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
            ...((state.conversationsAndMessages as ConversationsAndMessages)[key] || []),
            sentMessage
          ]
        }
      }));
    })

    socket.on("addContact", (users) => {
      const userA = users.userA;
      const userB = users.userB;

      const userToAdd = ((get().currentUser as User).id === userA) ? userB : userA;

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
  setConversationsAndMessages: (conversations : User[]) => {
    if (Object.keys((get().conversationsAndMessages ?? {})).length > 0)
      return;

    const initialCache = conversations.reduce((acc : ConversationsAndMessages, conversation : User) => {
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