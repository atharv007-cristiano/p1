# DeepShield Automated Deployment Helper
# This script initializes the git repository, commits the project files, and provides direct cloud deployment pathways.

Clear-Host
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "         DEEPSHIELD CLOUD DEPLOYMENT COMPANION          " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Initialize Git Repository
Write-Host "`n[Step 1] Initializing Git Repository..." -ForegroundColor Yellow
if (-not (Test-Path .git)) {
    git init
    Write-Host "-> Git repository initialized successfully." -ForegroundColor Green
} else {
    Write-Host "-> Git repository already initialized." -ForegroundColor Green
}

# Create .gitignore if it doesn't exist
if (-not (Test-Path .gitignore)) {
    @'
# Dependency directories
node_modules/
jspm_packages/
web_modules/
venv/
.env
*.db
__pycache__/
*.pyc

# Production builds
dist/
build/
.svelte-kit/
.next/

# Log files
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS Files
.DS_Store
Thumbs.db
'@ | Out-File -FilePath .gitignore -Encoding utf8
    Write-Host "-> Created standard .gitignore file." -ForegroundColor Green
}

# 2. Add and Commit Files
Write-Host "`n[Step 2] Staging and Committing Project Files..." -ForegroundColor Yellow
git add .
git commit -m "feat: complete production implementation of DeepShield framework and deployment configs"
Write-Host "-> Staged and committed all workspace files successfully." -ForegroundColor Green

# 3. Print Cloud Deployment Run-Guide
Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "             CLOUD HOSTING ROADMAP & PATHWAYS           " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

Write-Host "`nPathway A: Deploy React Frontend to Vercel (Free & High-Performance)" -ForegroundColor White
Write-Host "1. Create a free account at https://vercel.com/" -ForegroundColor Gray
Write-Host "2. Click 'Add New Project' -> import your GitHub repository." -ForegroundColor Gray
Write-Host "3. Set the 'Framework Preset' to Vite." -ForegroundColor Gray
Write-Host "4. Set Root Directory to: frontend" -ForegroundColor Gray
Write-Host "5. Click Deploy! Vercel will host your clinical UI globally on a secure CDN." -ForegroundColor Gray

Write-Host "`nPathway B: Deploy FastAPI Backend to Render (Free Web Service)" -ForegroundColor White
Write-Host "1. Create a free account at https://render.com/" -ForegroundColor Gray
Write-Host "2. Click 'New' -> 'Web Service' -> connect your GitHub repository." -ForegroundColor Gray
Write-Host "3. Set Root Directory to: backend" -ForegroundColor Gray
Write-Host "4. Build Command: pip install -r requirements.txt" -ForegroundColor Gray
Write-Host "5. Start Command: python -m uvicorn app.main:app --host 0.0.0.0 --port 10000" -ForegroundColor Gray
Write-Host "6. Add Environment Variable: PYTHONPATH=/workspace" -ForegroundColor Gray
Write-Host "7. Click Deploy! Render will host your REST API Gateway and wake the models." -ForegroundColor Gray

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "To link your local repository to GitHub, run the following:" -ForegroundColor Yellow
Write-Host "  git remote add origin <your-github-repo-url>" -ForegroundColor Gray
Write-Host "  git branch -M main" -ForegroundColor Gray
Write-Host "  git push -u origin main" -ForegroundColor Gray
Write-Host "=========================================================" -ForegroundColor Cyan
