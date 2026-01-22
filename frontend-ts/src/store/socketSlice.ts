import { type StateCreator } from 'zustand';
import {io, Socket} from 'socket.io-client';
import { type NavigateFunction } from 'react-router-dom';
import { type FullStore } from './useBoundStore';
import type { Message, Conversation } from '../types/storeTypes';
import { type ConversationsAndMessages } from './chatSlice';

export interface SocketSlice {
  socket: Socket | null,
  connect: (navigate : NavigateFunction) => void,
  disconnect: () => void,
}

export const createSocketSlice : StateCreator<FullStore, [], [], SocketSlice> = (set, get) => ({
  socket: null,
  connect: (navigate) => {
    if (get().socket != null)
      return;

    const socket = io(import.meta.env.VITE_API_DOMAIN, {withCredentials: true});

    socket.on('userOnline', (conversationId) => {
      
      set((state) => {
        const currConversation = state.conversationList?.[conversationId];
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
      const setLoginMessage = get().setLoginMessage;
      setLoginMessage('Signed Out');
      navigate('/login');
      
      get().clearStore();
    });

    socket.on("conversationDeleted", (conversationId : string) => {
      if (window.location.href.includes(conversationId))
        navigate('/home');
      console.log(conversationId);
      console.log(window.location.href);

      // find a way to cleanly remove the username and id of participants
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
      const setLoginMessage = get().setLoginMessage;
      setLoginMessage('Account Deleted');
      navigate('/login');

      get().clearStore();
    });

    set({socket});
  },
  disconnect: () => {
    const socket = get().socket;
    if (socket)
      socket.disconnect();
    
    set({
      socket: null
    });
  },
});