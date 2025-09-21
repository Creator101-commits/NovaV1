@echo off
REM Cleanup script for after successful Oracle migration

echo 🧹 Cleaning up migration files...

REM Remove CSV files (keep them temporarily until migration is verified)
echo.
echo Removing CSV migration files...
if exist "..\server\migrations\*.csv" (
    del "..\server\migrations\*.csv"
    echo ✅ CSV files removed
) else (
    echo ℹ️  No CSV files found
)

REM Check git status
echo.
echo 📋 Checking git status for sensitive files...
git status

echo.
echo 🔍 Files currently tracked by git:
git ls-files | findstr /i "wallet\|csv\|\.env"

echo.
echo ⚠️  SECURITY CHECKLIST:
echo    - Ensure .env is in .gitignore
echo    - Ensure oracle wallet files are in .gitignore  
echo    - Ensure CSV files are not committed
echo    - Oracle credentials are not in any committed files

echo.
echo 🎉 Cleanup complete!
echo 📚 Keep a backup of your Oracle wallet files in a secure location