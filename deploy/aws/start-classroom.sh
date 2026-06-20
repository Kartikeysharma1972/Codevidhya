#!/usr/bin/env bash
# Launches the Classroom AI FastAPI backend inside its venv. Run by pm2.
set -euo pipefail
cd "$(dirname "$0")/../../teacher/classroom-ai-main/backend"
source ../.venv/bin/activate
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8001}"
