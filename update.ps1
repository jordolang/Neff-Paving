# Neff Paving - Automated Deployment Script (PowerShell)
# This script handles GitHub push and Vercel deployment

Write-Host "🚀 Neff Paving - Automated Deployment Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status --porcelain

# Prompt for commit message
Write-Host ""
$commitMessage = Read-Host "💬 Enter commit message"

if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Update deployment configurations and admin panel"
}

Write-Host ""
Write-Host "🔄 Starting deployment process..." -ForegroundColor Green

# Stage all changes
Write-Host "📦 Staging all changes..." -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error staging changes" -ForegroundColor Red
    exit 1
}

# Commit changes
Write-Host "💾 Committing changes: '$commitMessage'" -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error committing changes" -ForegroundColor Red
    exit 1
}

# Push to GitHub
Write-Host "⬆️  Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error pushing to GitHub" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green

# Check if Vercel CLI is installed
Write-Host "🔍 Checking Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error installing Vercel CLI" -ForegroundColor Red
        Write-Host "📝 Please install manually: npm install -g vercel" -ForegroundColor Yellow
        exit 1
    }
}

# Deploy to Vercel
Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error deploying to Vercel" -ForegroundColor Red
    Write-Host "📝 You may need to run 'vercel login' first" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "✅ GitHub: Changes pushed to main branch" -ForegroundColor Green
Write-Host "✅ Vercel: Production deployment completed" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Your admin panel should be available at:" -ForegroundColor Cyan
Write-Host "   https://your-domain.vercel.app/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Configure environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "   2. Set up production database" -ForegroundColor White
Write-Host "   3. Update domain-specific URLs" -ForegroundColor White
Write-Host ""

# Pause to let user read the output
Read-Host "Press Enter to exit..."
