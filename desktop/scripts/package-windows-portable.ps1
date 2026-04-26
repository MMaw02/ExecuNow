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

function Find-VsDevCmd {
  $vswhere = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"

  if (Test-Path $vswhere) {
    $installationPath = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath

    if ($LASTEXITCODE -eq 0 -and $installationPath) {
      $candidate = Join-Path $installationPath "Common7\Tools\VsDevCmd.bat"

      if (Test-Path $candidate) {
        return $candidate
      }
    }
  }

  $fallbackCandidates = @(
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat"
  )

  return $fallbackCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}

function Invoke-TauriPortableBuild {
  $linkExe = Get-Command "link.exe" -ErrorAction SilentlyContinue

  if ($linkExe) {
    pnpm tauri build --no-bundle
    return $LASTEXITCODE
  }

  $vsDevCmd = Find-VsDevCmd

  if (!$vsDevCmd) {
    throw @"
The MSVC linker link.exe was not found.

Install "Build Tools for Visual Studio 2022" with the "Desktop development with C++" workload.
VS Code alone is not enough. After installing it, open a new PowerShell window and run this command again.
"@
  }

  Write-Host "MSVC linker was not found in PATH. Loading Visual Studio build environment:"
  Write-Host $vsDevCmd

  $cmdFile = [System.IO.Path]::ChangeExtension([System.IO.Path]::GetTempFileName(), ".cmd")

  try {
    Set-Content -Encoding ASCII -Path $cmdFile -Value @"
@echo off
call "$vsDevCmd" -arch=x64 -host_arch=x64
if errorlevel 1 exit /b %errorlevel%
pnpm tauri build --no-bundle
exit /b %errorlevel%
"@

    & cmd.exe /d /s /c "`"$cmdFile`""
    return $LASTEXITCODE
  }
  finally {
    if (Test-Path $cmdFile) {
      Remove-Item -Force $cmdFile
    }
  }
}

Push-Location $projectRoot
try {
  $buildExitCode = Invoke-TauriPortableBuild

  if ($buildExitCode -ne 0) {
    throw "Tauri build failed. Portable package was not created."
  }

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
