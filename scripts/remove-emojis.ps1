# Script to remove all emojis from TypeScript files
$rootPath = "C:\Users\prave\OneDrive\Desktop\Dev\RefyneoV1"

# Define emoji patterns to remove
$emojiPattern = '[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]'

# Get all TypeScript and Markdown files except node_modules
$files = Get-ChildItem -Path $rootPath -Include *.ts,*.tsx,*.md -Recurse -File | 
    Where-Object { $_.FullName -notmatch 'node_modules' -and $_.FullName -notmatch '\.vscode' -and $_.FullName -notmatch 'dist' }

$totalFiles = $files.Count
$processedFiles = 0
$modifiedFiles = 0

Write-Host "Found $totalFiles files to process..." -ForegroundColor Cyan

foreach ($file in $files) {
    $processedFiles++
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    
    if ($null -eq $content) { continue }
    
    $originalContent = $content
    
    # Remove emojis using regex
    $content = $content -replace $emojiPattern, ''
    
    # Check if content was modified
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modifiedFiles++
        $percentComplete = [math]::Round(($processedFiles / $totalFiles * 100), 1)
        Write-Host "[$percentComplete%] Modified: $($file.Name)" -ForegroundColor Green
    }
    else {
        $percentComplete = [math]::Round(($processedFiles / $totalFiles * 100), 1)
        Write-Host "[$percentComplete%] Skipped: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host "`nDone! Processed $processedFiles files, modified $modifiedFiles files." -ForegroundColor Cyan
