#!/usr/bin/env bash
# Feature Forge — Mac Mini remote access setup via Cloudflare Tunnel
# Run once to configure. After setup, the tunnel starts automatically on login.
#
# Prerequisites: a Cloudflare account with a domain pointed at Cloudflare nameservers.
# Usage: bash deploy/tunnel-setup.sh

set -e

TUNNEL_NAME="feature-forge"
SERVICE_PORT=3000

# ── 1. Install cloudflared ────────────────────────────────────────
if ! command -v cloudflared &>/dev/null; then
  echo "Installing cloudflared..."
  brew install cloudflared
fi
echo "✓ cloudflared $(cloudflared --version 2>&1 | head -1)"

# ── 2. Authenticate with Cloudflare ──────────────────────────────
echo ""
echo "→ Opening browser to authenticate with Cloudflare..."
echo "  (This will ask you to pick which domain to use)"
cloudflared tunnel login

# ── 3. Create the tunnel ─────────────────────────────────────────
echo ""
echo "→ Creating tunnel '$TUNNEL_NAME'..."
cloudflared tunnel create "$TUNNEL_NAME"

# Grab the tunnel UUID
TUNNEL_UUID=$(cloudflared tunnel list --output json 2>/dev/null \
  | python3 -c "import sys,json; ts=json.load(sys.stdin); \
    print(next(t['id'] for t in ts if t['name']=='$TUNNEL_NAME'))" 2>/dev/null || \
  cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')

echo "  Tunnel UUID: $TUNNEL_UUID"

# ── 4. Write tunnel config ───────────────────────────────────────
mkdir -p ~/.cloudflared

cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_UUID
credentials-file: $HOME/.cloudflared/$TUNNEL_UUID.json

ingress:
  # Replace 'feature-forge.yourdomain.com' with your actual subdomain
  - hostname: feature-forge.yourdomain.com
    service: http://localhost:$SERVICE_PORT
  - service: http_status:404
EOF

echo ""
echo "✓ Config written to ~/.cloudflared/config.yml"
echo ""
echo "→ IMPORTANT: Edit ~/.cloudflared/config.yml and replace"
echo "  'feature-forge.yourdomain.com' with your actual subdomain."
echo ""

# ── 5. Create DNS record ─────────────────────────────────────────
echo "→ To create the DNS CNAME record, run:"
echo "  cloudflared tunnel route dns $TUNNEL_NAME feature-forge.yourdomain.com"
echo ""

# ── 6. Install as a launchd service (auto-start on login) ────────
echo "→ Installing as a login item (auto-start)..."
cloudflared service install

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setup complete. Next steps:"
echo ""
echo "1. Edit ~/.cloudflared/config.yml — set your hostname"
echo "2. Run: cloudflared tunnel route dns $TUNNEL_NAME your-subdomain.yourdomain.com"
echo "3. Run: npm run build   (in this repo)"
echo "4. Run: node server.js  (or: sudo launchctl start com.cloudflare.cloudflared)"
echo ""
echo "After that, the app will be available at https://your-subdomain.yourdomain.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
