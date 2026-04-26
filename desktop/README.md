# ExecuNow Desktop

ExecuNow is a Tauri 2 desktop app built with React, TypeScript, and Vite.

## Development

Inside the DevContainer, dependencies are already expected to use pnpm:

```bash
pnpm install
pnpm tauri dev
```

If you are in the WSL shell outside the DevContainer and see `pnpm: command not
found`, or Corepack fails with a JavaScript syntax error such as
`Unexpected token '?'`, your WSL Node.js version is too old.

Install a current Node.js version in WSL first. One common path is nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node --version
```

Then activate pnpm:

```bash
corepack enable
corepack prepare pnpm@10.31.0 --activate
```

This WSL setup is useful for development, but not for producing the Windows
portable `.exe`.

## Windows Portable Build

Use the portable build when you want to run ExecuNow on Windows without an
installer, MSI, or entry in "Add or remove programs".

Install the Windows toolchain first:

1. Node.js for Windows.
2. pnpm for Windows:
   ```powershell
   corepack enable
   corepack prepare pnpm@10.31.0 --activate
   ```
3. Rust for Windows with the MSVC toolchain.
4. Build Tools for Visual Studio 2022 with the `Desktop development with C++`
   workload. This provides the MSVC linker, `link.exe`. VS Code alone is not
   enough.

If `winget` says Build Tools is already installed, modify the existing
installation to add the C++ workload. Run PowerShell as Administrator:

```powershell
& "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vs_installer.exe" modify --installPath "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools" --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --passive --norestart
```

After installing the Visual Studio Build Tools, open a new PowerShell window and
confirm the linker is available:

```powershell
where.exe link.exe
```

If that does not print a path, the portable build script will try to locate
Visual Studio Build Tools and load `VsDevCmd.bat` automatically. If it still
fails, open `Developer PowerShell for VS 2022` from the Start menu and run the
portable build there.

To check whether the C++ workload is actually installed, run:

```powershell
& "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
```

If this prints nothing, modify Build Tools and add `Desktop development with
C++`. If it prints a Visual Studio path, open `Developer PowerShell for VS 2022`
or run the portable build again so the script can load that environment.

Then run this from PowerShell or Windows Terminal, outside WSL:

```powershell
cd C:\dev\ExecuNow\desktop
pnpm install
pnpm build:windows:portable
```

This command cannot create the Windows portable package from WSL or the Linux
devcontainer. Open the project on Windows directly, or use a Windows CI runner.
If your repo lives inside WSL, copy or clone it to a Windows path such as
`C:\dev\ExecuNow` and run the command from PowerShell or Windows Terminal there.

The script builds the app without Tauri installer bundles, creates:

```text
release/ExecuNow/ExecuNow.exe
release/ExecuNow-portable-windows.zip
```

To use it on Windows:

1. Extract `ExecuNow-portable-windows.zip`.
2. Move the `ExecuNow` folder to a stable location, such as
   `%LOCALAPPDATA%\Programs\ExecuNow` or `Documents\Apps\ExecuNow`.
3. Run `ExecuNow.exe`.
4. Create a Windows shortcut manually if you want one.

To remove the portable app, close ExecuNow and delete the folder.

ExecuNow's web blocking feature updates the Windows `hosts` file while a block
is active, so Windows may show a UAC administrator prompt when that feature is
used. This is expected for the portable build too.

## Tests

```bash
pnpm test
```
