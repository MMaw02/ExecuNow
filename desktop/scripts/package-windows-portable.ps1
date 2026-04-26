Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$releaseRoot = Join-Path $projectRoot "release"
$portableDir = Join-Path $releaseRoot "ExecuNow"
$portableConfigDir = Join-Path $portableDir "config\widgets"
$zipPath = Join-Path $releaseRoot "ExecuNow-portable-windows.zip"
$buildLogPath = Join-Path $releaseRoot "windows-portable-build.log"
$sourceExeCandidates = @(
  (Join-Path $projectRoot "src-tauri\target\release\ExecuNow.exe"),
  (Join-Path $projectRoot "src-tauri\target\release\workspacesexecunowdesktop.exe")
)
$portableExe = Join-Path $portableDir "ExecuNow.exe"

function Get-NormalizedPath([string]$path) {
  if (!$path) {
    return $null
  }

  try {
    return [System.IO.Path]::GetFullPath($path)
  }
  catch {
    return $path
  }
}

function Stop-ExecuNowProjectProcesses {
  $projectRootNormalized = Get-NormalizedPath $projectRoot
  $candidatePrefixes = @(
    (Get-NormalizedPath (Join-Path $projectRoot "src-tauri\target\release")),
    (Get-NormalizedPath $portableDir)
  ) | Where-Object { $_ }

  $candidateNames = @("ExecuNow", "workspacesexecunowdesktop")

  Get-Process | Where-Object {
    $candidateNames -contains $_.ProcessName
  } | ForEach-Object {
    try {
      $processPath = $_.Path
    }
    catch {
      $processPath = $null
    }

    if (!$processPath) {
      return
    }

    $normalizedProcessPath = Get-NormalizedPath $processPath
    $belongsToProject = $candidatePrefixes | Where-Object {
      $normalizedProcessPath.StartsWith($_, [System.StringComparison]::OrdinalIgnoreCase)
    } | Select-Object -First 1

    if ($belongsToProject) {
      Write-Host "Stopping running ExecuNow process before build:"
      Write-Host "  $normalizedProcessPath"
      Stop-Process -Id $_.Id -Force
    }
  }
}

function Test-FileIsWritable([string]$path) {
  if (!(Test-Path $path)) {
    return $true
  }

  try {
    $stream = [System.IO.File]::Open($path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
    $stream.Close()
    return $true
  }
  catch {
    return $false
  }
}

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
  param(
    [string]$BuildLogPath
  )

  $linkExe = Get-Command "link.exe" -ErrorAction SilentlyContinue

  if ($BuildLogPath) {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $BuildLogPath) | Out-Null

    if (Test-Path $BuildLogPath) {
      Remove-Item -Force $BuildLogPath
    }
  }

  if ($linkExe) {
    if ($BuildLogPath) {
      & pnpm tauri build --no-bundle 2>&1 | Tee-Object -FilePath $BuildLogPath
    }
    else {
      pnpm tauri build --no-bundle
    }

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

    if ($BuildLogPath) {
      & cmd.exe /d /s /c "`"$cmdFile`"" 2>&1 | Tee-Object -FilePath $BuildLogPath
    }
    else {
      & cmd.exe /d /s /c "`"$cmdFile`""
    }

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
  Stop-ExecuNowProjectProcesses

  New-Item -ItemType Directory -Force -Path $releaseRoot | Out-Null

  $lockedSourceExe = $sourceExeCandidates | Where-Object { !(Test-FileIsWritable $_) } | Select-Object -First 1

  if ($lockedSourceExe) {
    throw @"
ExecuNow's release executable is still locked:
$lockedSourceExe

Close any running ExecuNow windows, system tray instances, or debugger sessions that were launched from this project,
then run pnpm build:windows:portable again.
"@
  }

  $buildExitCode = Invoke-TauriPortableBuild -BuildLogPath $buildLogPath

  if ($buildExitCode -ne 0) {
    throw @"
Tauri build failed with exit code $buildExitCode. Portable package was not created.

Review the build log for the root cause:
$buildLogPath

If the console output was truncated, open that file and look for the first error above the final summary.
"@
  }

  $sourceExe = $sourceExeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

  if (!$sourceExe) {
    throw "Expected Windows executable was not found in src-tauri\target\release"
  }

  if (Test-Path $portableDir) {
    Remove-Item -Recurse -Force $portableDir
  }

  New-Item -ItemType Directory -Force -Path $portableDir | Out-Null
  New-Item -ItemType Directory -Force -Path $portableConfigDir | Out-Null
  Copy-Item $sourceExe $portableExe
  Copy-Item (Join-Path $projectRoot "src-tauri\config-examples\widgets\*.windows.json") $portableConfigDir

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
