$log = "$env:TEMP\streamdock-widget-ps.log"
function Write-Log($msg) { "$(Get-Date -f 'HH:mm:ss') [SaveAudioConfig] $msg" | Out-File $log -Append -Encoding utf8 }

$json = Get-Clipboard
if ([string]::IsNullOrWhiteSpace($json)) {
    Write-Log "ERROR: clipboard is empty"
    exit 1
}

try {
    $cfg = $json | ConvertFrom-Json
    if (-not $cfg.device1Match) { throw "missing device1Match" }
} catch {
    Write-Log "ERROR: invalid config JSON: $_"
    exit 1
}

$configPath = Join-Path $PSScriptRoot 'toggle-audio-config.json'
try {
    $json | Set-Content -Path $configPath -Encoding UTF8
    Write-Log "Config saved to $configPath"
} catch {
    Write-Log "ERROR writing config: $_"
    exit 1
}
