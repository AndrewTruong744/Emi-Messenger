# Queries
Utilizes Cache aside structure, where you check if it exists in redis and fallback to prisma  
queries if it does not

## Redis Structure

user-${userId}-online (SET)
- socketIds : set()

user-${userId} (HSET):
- id: string
- username: string
- picture: (implement later)

// a list of conversations a user is in sorted from latest to earliest
user-${userId}-conversations (ZSET):
- [timeStamp, conversation][] 

conversation-${conversationId} (HSET):
- id: string,
- name: string,
- isGroup: bool,
- participants: string[] of userIds, JSON.stringify
- recentMessage: Message JSON.stringify
- timestamp: string
- picture: (implement later)

// Latest conversations at index 0
conversation-${conversationId}-messages (List): Message[] JSON.stringify
- ttl: 7d
