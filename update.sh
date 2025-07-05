#!/bin/bash
# Neff Paving - Automated Deployment Script (Bash)
# This script handles GitHub push and Vercel deployment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Neff Paving - Automated Deployment Script${NC}"
echo -e "${CYAN}=============================================${NC}"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Check git status
echo -e "${YELLOW}📋 Checking git status...${NC}"
git status --porcelain

# Prompt for commit message
echo ""
read -p "💬 Enter commit message: " commit_message

if [ -z "$commit_message" ]; then
    commit_message="Update deployment configurations and admin panel"
fi

echo ""
echo -e "${GREEN}🔄 Starting deployment process...${NC}"

# Stage all changes
echo -e "${YELLOW}📦 Staging all changes...${NC}"
git add .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error staging changes${NC}"
    exit 1
fi

# Commit changes
echo -e "${YELLOW}💾 Committing changes: '$commit_message'${NC}"
git commit -m "$commit_message"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error committing changes${NC}"
    exit 1
fi

# Push to GitHub
echo -e "${YELLOW}⬆️  Pushing to GitHub...${NC}"
git push origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error pushing to GitHub${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"

# Check if Vercel CLI is installed
echo -e "${YELLOW}🔍 Checking Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error installing Vercel CLI${NC}"
        echo -e "${YELLOW}📝 Please install manually: npm install -g vercel${NC}"
        exit 1
    fi
fi

# Deploy to Vercel
echo -e "${YELLOW}🌐 Deploying to Vercel...${NC}"
vercel --prod

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error deploying to Vercel${NC}"
    echo -e "${YELLOW}📝 You may need to run 'vercel login' first${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}✅ GitHub: Changes pushed to main branch${NC}"
echo -e "${GREEN}✅ Vercel: Production deployment completed${NC}"
echo ""
echo -e "${CYAN}🔗 Your admin panel should be available at:${NC}"
echo -e "${CYAN}   https://your-domain.vercel.app/admin${NC}"
echo ""
echo -e "${YELLOW}🔧 Next steps:${NC}"
echo -e "${WHITE}   1. Configure environment variables in Vercel dashboard${NC}"
echo -e "${WHITE}   2. Set up production database${NC}"
echo -e "${WHITE}   3. Update domain-specific URLs${NC}"
echo ""

# Pause to let user read the output
read -p "Press Enter to exit..."
