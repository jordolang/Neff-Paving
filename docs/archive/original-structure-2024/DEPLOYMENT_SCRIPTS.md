# 🚀 Automated Deployment Scripts

This project includes automated deployment scripts that handle both GitHub pushes and Vercel deployments with a single command.

## 📄 Available Scripts

### `update.ps1` (PowerShell - Windows)
- **Usage**: Right-click and "Run with PowerShell" or run `.\update.ps1` in PowerShell
- **Platform**: Windows PowerShell
- **Features**: Full automation with colored output and error handling

### `update.sh` (Bash - Linux/macOS/WSL)
- **Usage**: `./update.sh` in terminal
- **Platform**: Linux/macOS/WSL
- **Features**: Full automation with colored output and error handling

## 🔄 What These Scripts Do

1. **Check Git Repository**: Verify you're in a valid git repository
2. **Show Git Status**: Display current changes
3. **Prompt for Commit Message**: Ask for your commit message (or use default)
4. **Stage Changes**: `git add .`
5. **Commit Changes**: `git commit -m "your message"`
6. **Push to GitHub**: `git push origin main`
7. **Install Vercel CLI**: If not already installed
8. **Deploy to Vercel**: `vercel --prod`
9. **Success Summary**: Show deployment results and next steps

## 🎯 Quick Start

### Windows (PowerShell)
```powershell
.\update.ps1
```

### Linux/macOS/WSL (Bash)
```bash
./update.sh
```

## 📋 Prerequisites

- Git configured with your GitHub credentials
- Node.js and npm installed
- (Optional) Vercel CLI installed globally

## 🔧 First-Time Setup

If this is your first time using Vercel:
1. Run the script
2. When prompted, login to Vercel: `vercel login`
3. Follow the setup prompts

## ⚠️ Important Notes

- The scripts will prompt you for a commit message
- If you leave the commit message blank, it uses a default message
- Make sure you have push access to the GitHub repository
- Ensure your Vercel account has access to deploy the project

## 🎉 Benefits

- **One Command**: Deploy to both GitHub and Vercel instantly
- **Interactive**: Prompts for commit messages
- **Safe**: Includes error checking and validation
- **Informative**: Colored output shows progress and results
- **Cross-Platform**: Works on Windows, Linux, and macOS

## 🆘 Troubleshooting

**"Not in a git repository"**: Make sure you're in the project root directory

**"Error pushing to GitHub"**: Check your git credentials and internet connection

**"Error deploying to Vercel"**: Run `vercel login` first, then try again

**PowerShell Execution Policy**: If PowerShell blocks the script, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
