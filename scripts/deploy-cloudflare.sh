#!/usr/bin/env bash
# Deploy the Maaswad PWA to Cloudflare Pages.
set -euo pipefail
cd "$(dirname "$0")/../frontend"
npm install
npm run build
npx wrangler pages deploy dist --project-name maaswad
