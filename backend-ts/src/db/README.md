# Redis Structure

user-${userId}-online (key)

user-${userId} (HSET):
id: string
username: string
picture: (implement later)

user-${userId}-conversations (ZSET):
{conversationId: timeStamp} 

conversation-${conversationId} (HSET):
id: string,
name: string,
isGroup: bool,
participants: string[] of userIds, JSON.stringify
recentMessage: Message JSON.stringify
timestamp: string
picture: (implement later)

conversation-${conversationId}-messages (KEY VAL): Message[] JSON.stringify
ttl: 7d
