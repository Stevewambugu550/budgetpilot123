# Rebuilds & redeploys both sites with the hostname-based admin detection fix.
# Run with:    powershell -ExecutionPolicy Bypass -File .\redeploy.ps1

$UserSiteId  = "1cbb83f9-38db-4c10-8164-83353f96f525"
$AdminSiteId = "43bbe66d-a791-446c-8822-a15057edb41b"

Write-Host ""
Write-Host "=== Building locally ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "=== Deploying USER site ===" -ForegroundColor Cyan
npx netlify-cli deploy --prod --dir=dist --site=$UserSiteId

Write-Host ""
Write-Host "=== Deploying ADMIN site (same bundle, hostname triggers admin mode) ===" -ForegroundColor Cyan
npx netlify-cli deploy --prod --dir=dist --site=$AdminSiteId

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Green
Write-Host "User site:  https://budgetpilot-2026.netlify.app"
Write-Host "Admin site: https://budgetpilot-admin-2026.netlify.app"
Write-Host ""
Write-Host "Hard-refresh both (Ctrl+Shift+R) to bypass cache."
