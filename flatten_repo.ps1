# PowerShell script to flatten the repository structure
Write-Host "Starting repository flattening process..."

# Copy all files from ProductivityHub/ProductivityHub to root
Write-Host "Copying files from nested structure to root..."
robocopy "ProductivityHub\ProductivityHub" "." /E /MOVE /XD node_modules dist build .git

# Remove empty ProductivityHub directories
Write-Host "Removing empty directories..."
if (Test-Path "ProductivityHub\ProductivityHub") {
    Remove-Item "ProductivityHub\ProductivityHub" -Recurse -Force
}
if (Test-Path "ProductivityHub") {
    Remove-Item "ProductivityHub" -Recurse -Force
}

Write-Host "Repository flattening complete!"
Write-Host "Next steps:"
Write-Host "1. Run 'npm install' to install dependencies"
Write-Host "2. Run 'npm run check' to check for TypeScript errors"
Write-Host "3. Fix any import path issues"
