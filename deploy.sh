#!/bin/bash

# GhostShift Production Deployment Script
# This script prepares GhostShift for production deployment

echo "🚀 GhostShift Production Deployment Setup"
echo "=========================================="

# Check if GHOSTSHIFT_URL is provided
if [ -z "$1" ]; then
    echo ""
    echo "Usage: ./deploy.sh <production-url>"
    echo ""
    echo "Example:"
    echo "  ./deploy.sh https://ghostshift.railway.app"
    echo "  ./deploy.sh https://ghostshift.onrender.com"
    echo ""
    echo "This script will:"
    echo "  1. Update extension manifest for production domain"
    echo "  2. Update extension localhost detection"
    echo "  3. Create .env file for backend"
    echo ""
    exit 1
fi

PROD_URL="$1"
echo ""
echo "✅ Deploying to: $PROD_URL"
echo ""

# Extract domain from URL for manifest
DOMAIN=$(echo "$PROD_URL" | sed 's|https://||g;s|http://||g')

echo "📝 Step 1: Creating backend .env file..."
cat > GhostShift/backend/.env << EOF
# GhostShift Production .env
PORT=8787

# Stripe Configuration (leave empty to use demo mode)
# STRIPE_SECRET_KEY=sk_test_your_key_here
# STRIPE_PRICE_PLUS=price_xxx
# STRIPE_PRICE_FAMILY=price_xxx

# Debug
## comment to disable verbose logging
DEBUG=0
EOF
echo "✅ Created GhostShift/backend/.env"

echo ""
echo "✅ You're ready to deploy!"
echo ""
echo "Next steps:"
echo "================================"
echo "1. Commit these changes:"
echo "   git add -A && git commit -m 'Production deployment configuration'"
echo ""
echo "2. Push to GitHub:"
echo "   git push"
echo ""
echo "3. Connect to Railway.app or Render.com"
echo "   See DEPLOYMENT_TODAY.md for full instructions"
echo ""
echo "4. Once deployed, update extension manifest:"
echo "   Edit: extension-chrome-edge/manifest.json"
echo "   Add: \"https://$DOMAIN/*\""
echo ""
echo "5. Update extension config in Chrome:"
echo "   chrome://extensions > GhostShift > Details > Update"
echo ""
