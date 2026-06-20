#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Codevidhya — build + (re)start all four apps on the EC2 box.
# Re-run this any time you want to ship updates (after `git pull`).
#
#   bash deploy/aws/deploy-apps.sh
#
# Requires deploy/aws/secrets.env (copy from secrets.env.example and fill).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ── load secrets ────────────────────────────────────────────────────────────
if [ ! -f "$SCRIPT_DIR/secrets.env" ]; then
  echo "ERROR: $SCRIPT_DIR/secrets.env not found." >&2
  echo "       cp deploy/aws/secrets.env.example deploy/aws/secrets.env  and fill it in." >&2
  exit 1
fi
# Load KEY=VALUE pairs literally — robust against & ? = and Windows CRLF in
# values (plain `source` chokes on the & in MongoDB Atlas URIs).
while IFS= read -r line || [ -n "$line" ]; do
  line="${line%$'\r'}"
  case "$line" in ''|\#*) continue;; esac
  key="${line%%=*}"
  val="${line#*=}"
  case "$key" in ''|*[!A-Za-z0-9_]*) continue;; esac
  export "$key=$val"
done < "$SCRIPT_DIR/secrets.env"
: "${SERVER_IP:?Set SERVER_IP in deploy/aws/secrets.env (your EC2 public/Elastic IP)}"
GROQ_MODEL="${GROQ_MODEL:-llama-3.3-70b-versatile}"

echo "==> Deploying Codevidhya for public IP: $SERVER_IP"

# ── pull latest code ─────────────────────────────────────────────────────────
cd "$ROOT"
git pull --ff-only || echo "(git pull skipped — not a tracked checkout or local changes present)"

# ── write per-app .env files ─────────────────────────────────────────────────
echo "==> Writing .env files"

cat > "$ROOT/codevidhya-portal/server/.env" <<EOF
PORT=4000
NODE_ENV=production
JWT_SECRET=${PORTAL_JWT_SECRET}
MONGODB_URI=${PORTAL_MONGODB_URI}
CLIENT_URL=http://${SERVER_IP}
STUDENT_APP_URL=http://localhost:5000
TEACHER_APP_URL=http://localhost:8001
ADMIN_APP_URL=http://localhost:5001
EOF

cat > "$ROOT/student/Ai Tutor/server/.env" <<EOF
PORT=5000
MONGODB_URI=${AITUTOR_MONGODB_URI}
JWT_SECRET=${AITUTOR_JWT_SECRET}
GROQ_API_KEY=${GROQ_API_KEY}
EOF

cat > "$ROOT/Admin tool/server/.env" <<EOF
PORT=5001
MONGODB_URI=${ADMIN_MONGODB_URI}
CLASSROOM_DB_PATH=../../teacher/classroom-ai-main/backend/classroomai.db
JWT_SECRET=${ADMIN_JWT_SECRET}
ADMIN_SETUP_KEY=${ADMIN_SETUP_KEY}
EOF

cat > "$ROOT/teacher/classroom-ai-main/backend/.env" <<EOF
GROQ_API_KEY=${GROQ_API_KEY}
GROQ_MODEL=${GROQ_MODEL}
CORS_ORIGINS=http://${SERVER_IP},http://${SERVER_IP}:8001,http://localhost:5176
EOF

# portal client build-time vars (where the browser is redirected after login)
cat > "$ROOT/codevidhya-portal/client/.env.production" <<EOF
VITE_STUDENT_URL=http://${SERVER_IP}:5000
VITE_TEACHER_URL=http://${SERVER_IP}:8001
VITE_ADMIN_URL=http://${SERVER_IP}:5001
EOF

# ── build: portal ────────────────────────────────────────────────────────────
echo "==> Building portal"
( cd "$ROOT/codevidhya-portal/server" && npm install --omit=dev )
( cd "$ROOT/codevidhya-portal/client" && npm install --include=dev && npm run build )

# ── build: AI Tutor (student) ────────────────────────────────────────────────
echo "==> Building AI Tutor"
( cd "$ROOT/student/Ai Tutor" && npm run install:all && npm run build )

# ── build: Admin ─────────────────────────────────────────────────────────────
echo "==> Building Admin"
( cd "$ROOT/Admin tool" && npm run install:all && npm run build )

# ── build: Classroom AI (teacher, Python) ────────────────────────────────────
echo "==> Building Classroom AI"
cd "$ROOT/teacher/classroom-ai-main"
[ -d .venv ] || python3 -m venv .venv
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install -r backend/requirements.txt
( cd frontend && npm install --include=dev && npm run build )

# ── nginx (port 80 → portal :4000) ──────────────────────────────────────────
echo "==> Configuring nginx"
sudo cp "$SCRIPT_DIR/nginx-codevidhya.conf" /etc/nginx/sites-available/codevidhya
sudo ln -sf /etc/nginx/sites-available/codevidhya /etc/nginx/sites-enabled/codevidhya
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# ── start / reload all apps with pm2 ─────────────────────────────────────────
echo "==> Starting apps with pm2"
pm2 startOrReload "$SCRIPT_DIR/ecosystem.config.cjs" --update-env
pm2 save

echo ""
echo "==> Deploy complete."
echo "    Portal:        http://${SERVER_IP}"
echo "    AI Tutor:      http://${SERVER_IP}:5000"
echo "    Classroom AI:  http://${SERVER_IP}:8001"
echo "    Admin:         http://${SERVER_IP}:5001"
echo ""
echo "Check status:  pm2 status      Logs:  pm2 logs"
