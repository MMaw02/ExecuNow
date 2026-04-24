Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$releaseRoot = Join-Path $projectRoot "release"
$portableDir = Join-Path $releaseRoot "ExecuNow"
$zipPath = Join-Path $releaseRoot "ExecuNow-portable-windows.zip"
$sourceExeCandidates = @(
  (Join-Path $projectRoot "src-tauri\target\release\ExecuNow.exe"),
  (Join-Path $projectRoot "src-tauri\target\release\workspacesexecunowdesktop.exe")
)
$portableExe = Join-Path $portableDir "ExecuNow.exe"

Push-Location $projectRoot
try {
  pnpm tauri build --no-bundle

  $sourceExe = $sourceExeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

  if (!$sourceExe) {
    throw "Expected Windows executable was not found in src-tauri\target\release"
  }

  New-Item -ItemType Directory -Force -Path $releaseRoot | Out-Null

  if (Test-Path $portableDir) {
    Remove-Item -Recurse -Force $portableDir
  }

  New-Item -ItemType Directory -Force -Path $portableDir | Out-Null
  Copy-Item $sourceExe $portableExe

  if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
  }

  Compress-Archive -Path $portableDir -DestinationPath $zipPath

  Write-Host "Portable package created:"
  Write-Host $zipPath
}
finally {
  Pop-Location
}
