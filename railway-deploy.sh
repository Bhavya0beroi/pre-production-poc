#!/bin/bash
set -e

cd "/Users/bhavya/Desktop/pre-production-poc-main new"

echo "=========================================="
echo "  Railway Deployment Script"
echo "=========================================="
echo ""

echo "✅ Git push completed successfully!"
echo "   Commit: 55c444c"
echo "   Repository: https://github.com/Bhavya0beroi/pre-production-poc"
echo ""

echo "=========================================="
echo "  Step 1: Railway Login"
echo "=========================================="
echo ""
echo "Opening browser for Railway authentication..."
echo ""

railway login

if [ $? -ne 0 ]; then
    echo "❌ Railway login failed"
    exit 1
fi

echo ""
echo "✅ Successfully logged in to Railway!"
echo ""

echo "=========================================="
echo "  Step 2: Link to Railway Project"
echo "=========================================="
echo ""
echo "Linking to your Railway project..."
echo ""

railway link

echo ""
echo "=========================================="
echo "  Step 3: Deploy Application"
echo "=========================================="
echo ""
echo "Deploying to Railway..."
echo ""

railway up

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  ✅ DEPLOYMENT SUCCESSFUL!"
    echo "=========================================="
    echo ""
    echo "Your application is now live on Railway!"
    echo ""
    echo "Next steps:"
    echo "  1. Check deployment status: railway status"
    echo "  2. View logs: railway logs"
    echo "  3. Open dashboard: railway open"
    echo ""
    
    echo "Opening Railway dashboard..."
    railway open
else
    echo ""
    echo "❌ Deployment failed"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check logs: railway logs"
    echo "  2. Verify project link: railway status"
    echo "  3. Try again: railway up"
fi

echo ""
echo "=========================================="
echo "  Deployment Complete"
echo "=========================================="
