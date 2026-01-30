#!/bin/bash
set -e

TOKEN="baad88cc-b117-4ca8-a711-17211b377af3"
REPO="productlavaibhav/Pre-prod-tool"

echo "🚀 Starting Railway Deployment via API..."
echo ""

# Step 1: Get user info and workspace
echo "Step 1: Getting workspace ID..."
WORKSPACE_DATA=$(curl -sk -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { me { id email }}"}')

echo "User: $(echo $WORKSPACE_DATA | grep -o '"email":"[^"]*"')"
echo ""

# The issue is we need the workspace/team ID
# Let me try to create a project directly
echo "Step 2: Creating Railway project..."

# Try simpler project creation
PROJECT_DATA=$(curl -sk -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation { projectCreateEmpty { id name } }\"}")

echo "Response: $PROJECT_DATA"

