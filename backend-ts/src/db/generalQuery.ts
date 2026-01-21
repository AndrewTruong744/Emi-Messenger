import {prisma} from './prisma.js';
import * as conversation from './generalQueries/conversationQuery.js';
import * as message from './generalQueries/messageQuery.js';
import * as user from './generalQueries/userQuery.js';

export default {
  ...conversation,
  ...message,
  ...user,
  prisma
}