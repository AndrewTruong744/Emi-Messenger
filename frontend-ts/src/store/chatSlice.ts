import { type StateCreator} from 'zustand';
import type { Message, Conversation } from '../types/storeTypes';
import { type FullStore } from './useBoundStore';

export interface UuidToUsername {
  [key : string] : string
}

export interface UuidToOnlineStatus {
  [key : string] : boolean
}

export interface ConversationsAndMessages {
  [key : string]: Message[]
}

export interface ChatSlice {
  uuidToUsername : UuidToUsername | null,
  conversationList : {[conversationId : string]: Conversation} | null,
  conversationsAndMessages: ConversationsAndMessages | null,
  setConversations: (
    conversationList : Conversation[], 
    userIdToUsernames : Record<string,string>
  ) => void,
  updateConversationsAndMessages: (messages : Message[], conversationId : string) => void,
  clearChatSlice: () => void,
}

export const createChatSlice : StateCreator<FullStore, [], [], ChatSlice> = (set) => ({
  uuidToUsername: null,
  conversationList : null,
  conversationsAndMessages: null,
  setConversations: (
      conversationList : Conversation[], 
      userIdToUsernames : Record<string,string>
  ) => {
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
  clearChatSlice: () => {
    set({
      uuidToUsername: null,
      conversationList: null,
      conversationsAndMessages: null,
    });
  }
});