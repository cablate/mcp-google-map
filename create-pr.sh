#!/bin/bash

echo "🚀 Creating Pull Request for Places API Fix"
echo "=========================================="

if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
echo "📋 Current branch: $CURRENT_BRANCH"

if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "   Please commit or stash them before proceeding"
    exit 1
fi

REPO_URL=$(git remote get-url origin)
echo "🔗 Repository URL: $REPO_URL"

USERNAME=$(echo $REPO_URL | sed 's/.*github\.com\/\([^\/]*\)\/.*/\1/')
echo "👤 GitHub username: $USERNAME"

echo "🔍 Checking if fork exists..."
if curl -s "https://api.github.com/repos/$USERNAME/mcp-google-map" | grep -q '"message": "Not Found"'; then
    echo "❌ Fork not found at https://github.com/$USERNAME/mcp-google-map"
    echo ""
    echo "📝 Please follow these steps:"
    echo "1. Go to https://github.com/cablate/mcp-google-map"
    echo "2. Click the 'Fork' button"
    echo "3. Select your account ($USERNAME) as the destination"
    echo "4. Wait for GitHub to create the fork"
    echo "5. Run this script again"
    exit 1
else
    echo "✅ Fork found at https://github.com/$USERNAME/mcp-google-map"
fi

echo "📤 Pushing branch to your fork..."
if git push -u origin $CURRENT_BRANCH; then
    echo "✅ Successfully pushed branch to your fork"
    echo ""
    echo "🎉 Next steps:"
    echo "1. Go to https://github.com/$USERNAME/mcp-google-map"
    echo "2. Look for the banner saying '$CURRENT_BRANCH had recent pushes'"
    echo "3. Click 'Compare & pull request'"
    echo "4. Use the title: 'fix: migrate to new Google Places API (New) to resolve HTTP 403 errors'"
    echo "5. Copy the description from PLACES_API_FIX_SUMMARY.md"
    echo "6. Submit the pull request"
    echo ""
    echo "🔗 Direct link to create PR:"
    echo "https://github.com/cablate/mcp-google-map/compare/main...$USERNAME:$CURRENT_BRANCH"
else
    echo "❌ Failed to push branch"
    echo "   Make sure you have push access to your fork"
    exit 1
fi