#!/bin/bash
cd /Users/bhavya/Downloads/pre-production-poc-main

echo "=========================================="
echo "  Railway Deployment Script"
echo "=========================================="
echo ""

# Check if logged in
echo "Checking Railway authentication..."
railway whoami > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo ""
    echo "Not logged into Railway."
    echo ""
    echo "Please get your Railway API Token:"
    echo "1. Go to: https://railway.app/account/tokens"
    echo "2. Login with 'productlavaibhav' GitHub account"
    echo "3. Click 'Create New Token'"
    echo "4. Copy the token"
    echo ""
    echo "Enter your Railway API Token:"
    read -s RAILWAY_TOKEN
    
    echo ""
    echo "Authenticating with Railway..."
    export RAILWAY_TOKEN
    
    railway whoami > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "❌ Railway authentication failed. Please check your token."
        echo "Press any key to close..."
        read -n 1
        exit 1
    fi
fi

echo "✅ Logged into Railway"
railway whoami
echo ""

# Create new project
echo "Creating Railway project from GitHub repo..."
echo ""

# Use railway CLI to create project
railway init --name "Pre-prod-tool"

if [ $? -ne 0 ]; then
    echo "Linking existing project..."
    railway link
fi

echo ""
echo "🚀 Deploying to Railway..."
railway up --detach

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment initiated successfully!"
    echo ""
    echo "Opening Railway dashboard..."
    sleep 2
    railway open
else
    echo "❌ Deployment failed."
fi

echo ""
echo "Press any key to close..."
read -n 1
