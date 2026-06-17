#!/usr/bin/env bash
# Render auto-deploys from git via render.yaml. This triggers a manual deploy hook.
set -euo pipefail
: "${RENDER_DEPLOY_HOOK:?Set RENDER_DEPLOY_HOOK to your Render deploy hook URL}"
curl -fsSL -X POST "$RENDER_DEPLOY_HOOK" && echo "Render deploy triggered."
