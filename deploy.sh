#!/bin/bash
set -e

HOST="${1:-$DEPLOY_HOST}"
if [ -z "$HOST" ]; then
  echo "Usage: ./deploy.sh <user@host>"
  echo "Or set DEPLOY_HOST environment variable"
  exit 1
fi

echo "🚀 Deploying Wiki-Chat to $HOST ..."

rsync -avz --delete \
  --exclude .env \
  --exclude node_modules \
  --exclude .git \
  --exclude drizzle \
  ./ "$HOST:/var/www/wikichat/"

ssh "$HOST" "cd /var/www/wikichat && docker compose up -d --build"

echo "✅ Deployed successfully!"
echo "   Frontend: https://wikichat.elmarhepp.de"
echo "   API:      https://wikichat-api.elmarhepp.de"
