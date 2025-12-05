#!/bin/bash

# Simple deployment script for static hosting

echo "🚀 Deploying TravelPlus Invoice Extractor..."
echo ""
echo "Choose deployment method:"
echo "1. Deploy to GitHub Pages (no login required)"
echo "2. Deploy to Surge.sh (instant, no login)"
echo "3. Deploy to Vercel (requires login)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo "📦 Preparing for GitHub Pages deployment..."
    # Create a simple index file that serves the app
    cp index.html docs/index.html 2>/dev/null || mkdir -p docs && cp index.html docs/
    cp -r auth config utils styles.css app.js *.js docs/ 2>/dev/null
    echo "✅ Files prepared in docs/ folder"
    echo ""
    echo "📝 Next steps:"
    echo "1. Push to GitHub: git add . && git commit -m 'Deploy' && git push"
    echo "2. Go to repo Settings > Pages"
    echo "3. Select 'Deploy from branch' > main > /docs"
    echo "4. Your app will be at: https://[username].github.io/[repo-name]"
    ;;
  2)
    echo "📦 Installing Surge.sh..."
    npm install -g surge
    echo "🚀 Deploying with Surge..."
    surge . travelplus-invoice.surge.sh
    echo "✅ Deployed to: http://travelplus-invoice.surge.sh"
    ;;
  3)
    echo "🔐 Please login to Vercel first:"
    vercel login
    echo "🚀 Deploying to Vercel..."
    vercel --yes
    ;;
  *)
    echo "Invalid choice"
    ;;
esac