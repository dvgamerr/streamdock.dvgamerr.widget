$ErrorActionPreference = 'Stop'

$port = 39452
$healthUrl = "http://127.0.0.1:$port/health"

try {
  $null = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 2
  exit 0
} catch {
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverScript = Join-Path $scriptDir 'claude-usage-server.js'

if (-not (Test-Path -LiteralPath $serverScript)) {
  throw "Missing helper script: $serverScript"
}

$bunCommand = Get-Command bun -ErrorAction Stop

Start-Process `
  -FilePath $bunCommand.Source `
  -ArgumentList @($serverScript) `
  -WorkingDirectory $scriptDir `
  -WindowStyle Hidden
