#!/bin/bash
set -e
export PATH=$PATH:/root/.local/share/pnpm
cd /opt/mypkstore

echo "=== [1/4] Building frontend ==="
PORT=3000 BASE_PATH="/" pnpm --filter @workspace/mypkstore run build

echo "=== [2/4] Building API server ==="
pnpm --filter @workspace/api-server run build

echo "=== [3/4] Copying frontend to API public ==="
cp -r artifacts/mypkstore/dist/public/* artifacts/api-server/dist/public/

echo "=== [4/4] Restarting PM2 ==="
pm2 restart mypkstore

echo "=== Done! ==="
curl -so /dev/null http://localhost:4000/ -w "Site status: HTTP %{http_code}\n"
