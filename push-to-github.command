#!/bin/bash
cd /Users/bhavya/Downloads/pre-production-poc-main

echo "=========================================="
echo "  GitHub Push Script"
echo "=========================================="
echo ""

# Clear existing credentials
echo "Clearing cached credentials..."
printf "protocol=https\nhost=github.com\n\n" | git credential-osxkeychain erase 2>/dev/null

# Prompt for token
echo ""
echo "Please enter your GitHub Personal Access Token for 'productlavaibhav':"
echo "(Create one at: https://github.com/settings/tokens/new with 'repo' scope)"
echo ""
read -s GITHUB_TOKEN

# Set remote with token
echo ""
echo "Setting up authentication..."
git remote set-url origin https://productlavaibhav:${GITHUB_TOKEN}@github.com/productlavaibhav/Pre-prod-tool.git

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "Repository: https://github.com/productlavaibhav/Pre-prod-tool"
else
    echo ""
    echo "❌ Push failed. Please check your token and try again."
fi

echo ""
echo "Press any key to close..."
read -n 1
