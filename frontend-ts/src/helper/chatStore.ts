// import {create} from 'zustand';

// interface User {
//   id: string,
//   username: string,
//   email: string,
//   sub: string,
// };

// interface Message {
//   id: string,
//   sent: Date,
//   content: string,
//   senderId: string,
//   receiverId: string,
//   from?: string
// }

// interface UuidToUsername {
//   [key : string] : string
// }

// interface UuidToOnlineStatus {
//   [key : string] : boolean
// }

// interface ConversationsAndMessages {
//   [key : string]: Message[]
// }

// interface UserChat {
//   uuidToUsername : UuidToUsername | null,
//   uuidToOnlineStatus : UuidToOnlineStatus | null,
//   conversationsAndMessages: ConversationsAndMessages | null,
//   setConversations: (conversations : []) => void,
//   updateConversations: (id : string, messages : [] | null) => void,
// }

// const useChat = create<UserChat>()((set, get) => ({
//   uuidToUsername: null,
//   uuidToOnlineStatus: null,
//   conversationsAndMessages: null,
//   setConversations: (conversations : User[]) => {
//     set((state) => {
//       const newUuidToUsername = { ...state.uuidToUsername };
//       const updatedCache = { ...state.conversationsAndMessages };

//       conversations.forEach((user) => {
//         newUuidToUsername[user.id] = user.username;
        
//         // ONLY set to empty array if it doesn't already have messages
//         if (!updatedCache[user.id]) {
//           updatedCache[user.id] = [];
//         }
//       });

//       return {
//         uuidToUsername: newUuidToUsername,
//         conversationsAndMessages: updatedCache,
//       };
//     });
//   },
//   updateConversations: (id, messages) => {
//     const newMessages = messages || [];

//     set((state) => ({
//       conversationsAndMessages: {
//         ...state.conversationsAndMessages,
//         [id]: newMessages,
//       }
//     }));
//   },
// }));

// export default useChat;