#!/bin/bash
set -e

export RAILWAY_TOKEN="baad88cc-b117-4ca8-a711-17211b377af3"

echo "=========================================="
echo "  Complete Railway Deployment"
echo "=========================================="
echo ""

# Check authentication
echo "✓ Checking Railway authentication..."
WHOAMI=$(railway whoami 2>&1)
if [[ $WHOAMI == *"Unauthorized"* ]]; then
    echo "❌ Authentication failed"
    exit 1
fi
echo "✅ Logged in as: $(echo $WHOAMI | head -1)"
echo ""

# Initialize Railway project
echo "✓ Creating Railway project..."
railway init --name "Pre-prod-tool" 2>&1 || echo "Project may already exist"
echo ""

# Link to repo
echo "✓ Linking to GitHub repo..."
railway link 2>&1 || echo "Already linked or manual linking required"
echo ""

# Deploy backend (server folder)
echo "=========================================="
echo "  Deploying Backend Server"
echo "=========================================="
cd server
railway up --service backend --detach 2>&1 || railway up --detach
cd ..
echo ""

# Deploy frontend (root)
echo "=========================================="
echo "  Deploying Frontend"
echo "=========================================="
railway up --service frontend --detach 2>&1 || railway up --detach
echo ""

echo "✅ Deployment initiated!"
echo ""
echo "View your project:"
railway open

