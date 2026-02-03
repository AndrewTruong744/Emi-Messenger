#!/bin/sh

npx prisma migrate deploy --config ./src/prisma.config.ts

# log data (previously used for cdk trigger invocation type of REQUEST RESPONSE (failed))
if [ $? -ne 0 ]; then
  echo '{"status": "failed"}'
  exit 1
fi

echo '{"status": "success"}'
sleep 1
exit 0