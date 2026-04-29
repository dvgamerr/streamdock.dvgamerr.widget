$log = "$env:TEMP\streamdock-widget-ps.log"
function Write-Log($msg) { "$(Get-Date -f 'HH:mm:ss') [ToggleAudio] $msg" | Out-File $log -Append -Encoding utf8 }

try { Import-Module AudioDeviceCmdlets -ErrorAction Stop } catch { Write-Log "ERROR import AudioDeviceCmdlets: $_"; exit 1 }
try { Import-Module BurntToast -ErrorAction Stop } catch { Write-Log "ERROR import BurntToast: $_"; exit 1 }

# Match by substring — survives "(2- ...)" prefix changes from Windows.
$device1Match = '*Sound Blaster X5*'
$device1Show  = 'Headphones (X5)'
$device2Match = '*Sound Blaster GS5*'
$device2Show  = 'Speakers (GS5)'

# Dump every playback device once so we can see real names in the log.
$allPlayback = Get-AudioDevice -List | Where-Object { $_.Type -eq 'Playback' }
Write-Log "Playback devices found: $($allPlayback.Count)"
foreach ($d in $allPlayback) {
    Write-Log "  [$($d.Index)] default=$($d.Default) name='$($d.Name)' id=$($d.ID)"
}

$currentDevice = Get-AudioDevice -Playback
Write-Log "Current default: '$($currentDevice.Name)'"

# Decide target: if current matches device1 → switch to device2, else → device1.
if ($currentDevice.Name -like $device1Match) {
    $targetMatch = $device2Match
    $targetShow  = $device2Show
} else {
    $targetMatch = $device1Match
    $targetShow  = $device1Show
}
Write-Log "Target match: $targetMatch"

$targetDevice = $allPlayback | Where-Object { $_.Name -like $targetMatch } | Select-Object -First 1
if (-not $targetDevice) {
    Write-Log "ERROR: target device not found"
    try {
        New-BurntToastNotification -UniqueIdentifier 'audio-toggle' -Text 'Audio toggle failed', "No device matching $targetMatch"
    } catch {}
    exit 1
}

Write-Log "Switching to: '$($targetDevice.Name)'"
try {
    $targetDevice | Set-AudioDevice | Out-Null
} catch {
    Write-Log "ERROR Set-AudioDevice: $_"
    exit 1
}

$verify = Get-AudioDevice -Playback
Write-Log "After switch, default is: '$($verify.Name)'"

$uid = 'audio-toggle'
Remove-BTNotification -UniqueIdentifier $uid -ErrorAction SilentlyContinue
$expire = (Get-Date).AddSeconds(3)
New-BurntToastNotification -UniqueIdentifier $uid -Text 'Audio Device Changed', $targetShow -ExpirationTime $expire
Write-Log "Done: $targetShow"
