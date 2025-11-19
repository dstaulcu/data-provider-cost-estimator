# Deployment script for Data Provider Cost Estimator
# Usage: .\deploy.ps1 -BucketName <bucket-name> [-Prefix <s3-prefix>] [-Region <region>]

param(
    [Parameter(Mandatory=$true)]
    [string]$BucketName,
    
    [Parameter(Mandatory=$false)]
    [string]$Prefix = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

# Set base path for Vite build
$BasePath = if ($Prefix) { "/$Prefix/" } else { "/" }
$env:VITE_BASE_PATH = $BasePath

Write-Host "Building application with base path: $BasePath" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

$S3Path = if ($Prefix) { "$BucketName/$Prefix" } else { $BucketName }
Write-Host "Deploying to S3 path: s3://$S3Path in region: $Region" -ForegroundColor Cyan

# Upload all files recursively with cache control headers
Get-ChildItem -Path dist -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring((Resolve-Path "dist").Path.Length + 1).Replace('\', '/')
    $cacheControl = if ($_.Name -eq "index.html") { "no-cache, no-store, must-revalidate" } else { "max-age=300" }
    Write-Host "Uploading $relativePath with cache-control: $cacheControl" -ForegroundColor Gray
    aws s3 cp $_.FullName "s3://$S3Path/$relativePath" --cache-control $cacheControl --region $Region
}

# Clean up old files from S3 that no longer exist in dist
Write-Host "Syncing and removing deleted files..." -ForegroundColor Cyan
aws s3 sync dist/ "s3://$S3Path/" --delete --region $Region --cache-control "max-age=300"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment complete!" -ForegroundColor Green
    if ($Prefix) {
        Write-Host "Website URL: http://$BucketName.s3-website-$Region.amazonaws.com/$Prefix/index.html" -ForegroundColor Yellow
    } else {
        Write-Host "Website URL: http://$BucketName.s3-website-$Region.amazonaws.com" -ForegroundColor Yellow
    }
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}
