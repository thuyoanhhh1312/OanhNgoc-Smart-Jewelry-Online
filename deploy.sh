#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$HOME/OanhNgoc-Smart-Jewelry-Online"
WEB_ROOT="/var/www/oanhngocjewelry.online"
PM2_APP_NAME="jewelry-server"

echo ">>> CI: Go to project folder"
cd "$PROJECT_DIR"

echo ">>> CI: Pull latest code (origin/main)"
git fetch origin main
git reset --hard origin/main

echo ">>> CI: Install server deps (production)"
cd server
npm ci --only=production 2>/dev/null || npm install --production

echo ">>> CI: Restart backend with pm2"
if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_APP_NAME"
else
  pm2 start npm --name "$PM2_APP_NAME" -- run dev
fi

echo ">>> CI: Build client"
cd ../client
npm ci 2>/dev/null || npm install
npm run build

echo ">>> CI: Deploy client static files to Nginx web root"
rm -rf "${WEB_ROOT:?}"/*
cp -r dist/* "$WEB_ROOT"/

echo ">>> CI: Reload Nginx (non-interactive)"
if sudo -n systemctl reload nginx 2>/dev/null; then
  echo ">>> CI: Nginx reloaded successfully"
else
  echo ">>> CI WARNING: Cannot reload Nginx (sudo needs password)."
  echo ">>> CI WARNING: Please run manually on VM: sudo systemctl reload nginx"
fi

echo ">>> CI: Deploy done!"