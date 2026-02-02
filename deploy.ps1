# Deploy script - Push updates to Raspberry Pi (one password prompt)
# Usage: .\deploy.ps1

$PI_USER = "isaac"
$PI_IP = "10.0.0.108"
$PI_PATH = "/home/isaac/media-request-portal"
$LOCAL_PATH = "C:\Users\Gaming\Desktop\Website\media-request-portal"

Write-Host "Deploying to Raspberry Pi ($PI_IP)..." -ForegroundColor Cyan

# Create a temporary directory for files to transfer
$TEMP_DIR = "$env:TEMP\media-request-deploy"
if (Test-Path $TEMP_DIR) { Remove-Item -Recurse -Force $TEMP_DIR }
New-Item -ItemType Directory -Path $TEMP_DIR | Out-Null

Write-Host "Preparing files..." -ForegroundColor Yellow

# Copy source directories
$dirs = @("pages", "components", "lib", "public", "styles")
foreach ($dir in $dirs) {
    if (Test-Path "$LOCAL_PATH\$dir") {
        Copy-Item -Path "$LOCAL_PATH\$dir" -Destination "$TEMP_DIR\" -Recurse -Force
    }
}

# Copy individual files
$files = @("package.json", "package-lock.json", "next.config.js", "tsconfig.json", "next-env.d.ts", "Dockerfile", "docker-compose.yml", ".env.local", "start.sh", ".dockerignore")
foreach ($file in $files) {
    $filePath = Join-Path $LOCAL_PATH $file
    if (Test-Path $filePath) {
        Copy-Item -Path $filePath -Destination $TEMP_DIR -Force
    }
}

Write-Host "Transferring files (one password prompt)..." -ForegroundColor Yellow
scp -r "$TEMP_DIR\*" "$PI_USER@$PI_IP`:$PI_PATH/"

# Cleanup
Remove-Item -Recurse -Force $TEMP_DIR

Write-Host "`nAll files transferred!" -ForegroundColor Green

# Ask to rebuild
$rebuild = Read-Host "`nRebuild Docker container? (y/n)"
if ($rebuild -eq "y" -or $rebuild -eq "Y") {
    Write-Host "`nRebuilding container..." -ForegroundColor Cyan
    ssh $PI_USER@$PI_IP "cd $PI_PATH ; docker compose down ; docker compose build --no-cache ; docker compose up -d ; docker logs -f media-request-portal"
} else {
    Write-Host "`nSkipped rebuild. Run manually when ready:" -ForegroundColor Yellow
    Write-Host "ssh isaac@10.0.0.108 'cd $PI_PATH ; docker compose up -d --build'"
}

Write-Host "`nDone!" -ForegroundColor Green
