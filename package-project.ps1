# UniBite Project Packaging Script
# This script creates a zip file of the entire project

$projectPath = $PSScriptRoot
$zipName = "UniBite-Complete-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').zip"
$zipPath = Join-Path $projectPath ".." $zipName

Write-Host "Packaging UniBite project..." -ForegroundColor Green
Write-Host "Source: $projectPath" -ForegroundColor Cyan
Write-Host "Output: $zipPath" -ForegroundColor Cyan

# Exclude node_modules and .next if they exist
$excludeItems = @('node_modules', '.next', '*.zip')

try {
    Compress-Archive -Path "$projectPath\*" -DestinationPath $zipPath -Force -CompressionLevel Optimal
    Write-Host "`n✅ Successfully created: $zipName" -ForegroundColor Green
    Write-Host "Location: $zipPath" -ForegroundColor Yellow
    Write-Host "`nFile size: $([math]::Round((Get-Item $zipPath).Length / 1MB, 2)) MB" -ForegroundColor Cyan
} catch {
    Write-Host "`n❌ Error creating zip file: $_" -ForegroundColor Red
}
