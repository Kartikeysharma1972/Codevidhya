#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Codevidhya — one-time server provisioning for a fresh Ubuntu 24.04 EC2 box.
# Run this ONCE, right after you SSH in. It is safe to re-run.
#
#   bash deploy/aws/setup-server.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "==> Codevidhya server provisioning starting"

# 1) Swap — small instances (t3.small = 2 GB RAM) can OOM during Vite builds.
if ! sudo swapon --show | grep -q '/swapfile'; then
  echo "==> Creating 4G swap file"
  sudo fallocate -l 4G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 2) System packages
echo "==> Installing system packages"
sudo apt-get update -y
sudo apt-get install -y git build-essential nginx python3 python3-venv python3-pip curl

# 3) Node.js 20 (NodeSource)
if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# 4) pm2 process manager
echo "==> Installing pm2"
sudo npm install -g pm2

# 5) nginx on at boot
sudo systemctl enable nginx
sudo systemctl start nginx

echo ""
echo "==> Provisioning done."
echo "    Node:   $(node -v)"
echo "    npm:    $(npm -v)"
echo "    Python: $(python3 --version)"
echo ""
echo "Next: create deploy/aws/secrets.env, then run  bash deploy/aws/deploy-apps.sh"
