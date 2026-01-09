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

interface Message {
  id: string,
  sent: Date,
  content: string,
  senderId: string,
  receiverId: string,
  from?: string
}

interface UuidToUsername {
  [key : string] : string
}

interface UuidToOnlineStatus {
  [key : string] : boolean
}

interface ConversationsAndMessages {
  [key : string]: Message[]
}

interface UserSocket {
  currentUser: User | null,
  socket: Socket | null,
  uuidToUsername : UuidToUsername | null,
  uuidToOnlineStatus : UuidToOnlineStatus | null,
  conversationsAndMessages: ConversationsAndMessages | null,
  setCurrentUser: (currentUser : User) => void,
  connect: (navigate : NavigateFunction) => void,
  disconnect: () => void,
  setConversationsAndMessages: (conversations : []) => void,
  updateConversationsAndMessages: (id : string, messages : [] | null) => void,
  updateOnlineStatuses: (id : string, status : boolean) => void,
  clearStore: () => void,
}

const useSocket = create<UserSocket>()((set, get) => ({
  currentUser: null,
  socket: null,
  uuidToUsername: null,
  uuidToOnlineStatus : null,
  conversationsAndMessages: null,
  setCurrentUser: (currentUser) => {
    set({currentUser});
  },
  connect: (navigate) => {
    if (get().socket != null)
      return;

    const socket = io(import.meta.env.VITE_API_DOMAIN, {withCredentials: true});

    socket.on('userOnline', (otherUserId) => {
      console.log('online!');
      set((state) => ({
        uuidToOnlineStatus: {
          ...state.uuidToOnlineStatus,
          [otherUserId]: true
        }
      }));
    });

    socket.on('userOffline', (otherUserId) => {
      set((state) => ({
        uuidToOnlineStatus: {
          ...state.uuidToOnlineStatus,
          [otherUserId]: false
        }
      }))
    })

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
        uuidToUsername: {
          ...state.uuidToUsername,
          [userToAdd.id]: userToAdd.username,
        },
        uuidToOnlineStatus: {
          ...state.uuidToOnlineStatus,
          [userToAdd.id]: userToAdd.online,
        },
        conversationsAndMessages: {
          ...state.conversationsAndMessages,
          [userToAdd.id]: [],
        }
      }));
    });

    socket.on("signout", () => {
      const setLoginMessage = useLogin.getState().setLoginMessage;
      setLoginMessage('Signed Out');
      navigate('/login');
      
      useClear.getState().clearStore();
    });

    socket.on("userDeleted", (otherUserId : string) => {
      if (window.location.href.includes(otherUserId))
        navigate('/home');

      set((state) => {
        const {[otherUserId]: removedUuidUsername, ...newUuidToUsername} = state.uuidToUsername || {};
        const {[otherUserId]: removedUuidStatus, ...newUuidToOnlineStatus} = state.uuidToOnlineStatus || {};
        const {[otherUserId]: removedConversationAndMessage, ...newConversationAndMessages} 
          = state.conversationsAndMessages || {};

        return {
          uuidToUsername: newUuidToUsername,
          uuidToOnlineStatus: newUuidToOnlineStatus,
          conversationsAndMessages: newConversationAndMessages
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
  setConversationsAndMessages: (conversations : User[]) => {
    set((state) => {
      const newUuidToUsername = { ...state.uuidToUsername };
      const updatedCache = { ...state.conversationsAndMessages };
      const newUuidToOnlineStatus = {...state.uuidToOnlineStatus};

      conversations.forEach((user) => {
        console.log(user);
        newUuidToUsername[user.id] = user.username;
        newUuidToOnlineStatus[user.id] = user.online;
        // ONLY set to empty array if it doesn't already have messages
        if (!updatedCache[user.id]) {
          updatedCache[user.id] = [];
        }
      });

      return {
        uuidToUsername: newUuidToUsername,
        uuidToOnlineStatus: newUuidToOnlineStatus,
        conversationsAndMessages: updatedCache,
      };
    });
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
  updateOnlineStatuses: (id, status) => {
    set((state) => ({
      uuidToOnlineStatus: {
        ...state.uuidToOnlineStatus,
        [id]: status,
      }
    }));
  },
  clearStore: () => {
    set({
      currentUser: null,
      socket: null,
      uuidToUsername: null,
      conversationsAndMessages: null,
    });
  }
}));

export {useSocket};