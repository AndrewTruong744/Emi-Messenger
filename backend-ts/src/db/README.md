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

user-${userId}-conversations (ZSET):
- !!! a list of conversations a user is in sorted from latest to earliest
- [timeStamp, conversation][] 

conversation-${conversationId} (HSET):
- id: string,
- name: string,
- isGroup: bool,
- participants: string[] of userIds, JSON.stringify
- recentMessage: Message JSON.stringify
- timestamp: string
- picture: (implement later)

conversation-${conversationId}-messages (List): 
- !!! Latest conversations are at index 0
- Message[] JSON.stringify
- ttl: 7d
