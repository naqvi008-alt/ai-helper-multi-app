# Convenience: starts hub + all 4 apps in one PowerShell window.
# Equivalent to `npm run dev`. Use Ctrl+C to stop.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
npm run dev
