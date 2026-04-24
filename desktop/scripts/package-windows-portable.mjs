import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, "..");
const powershellScript = join(scriptDir, "package-windows-portable.ps1");
const isWsl = process.platform === "linux" && (process.env.WSL_DISTRO_NAME || procVersionMentionsMicrosoft());

function procVersionMentionsMicrosoft() {
  try {
    return readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft");
  } catch {
    return false;
  }
}

if (process.platform !== "win32") {
  const environmentMessage = isWsl
    ? [
        "You are currently running inside WSL, which is still a Linux environment for this build.",
        "Build the portable package with Windows Node, pnpm, Rust, and Tauri from PowerShell or Windows Terminal outside WSL.",
        "",
        "Recommended: keep or copy the repo under a Windows path such as C:\\dev\\ExecuNow, then run:",
      ]
    : [
        "You are currently running inside a Linux environment, so this command cannot create ExecuNow.exe.",
        "",
        "Run this from PowerShell or Windows Terminal on your Windows computer:",
      ];

  console.error(
    [
      "The Windows portable package must be built on Windows.",
      "",
      ...environmentMessage,
      "",
      "  cd desktop",
      "  pnpm install",
      "  pnpm build:windows:portable",
      "",
      "Output:",
      "  release/ExecuNow/ExecuNow.exe",
      "  release/ExecuNow-portable-windows.zip",
    ].join("\n"),
  );
  process.exit(1);
}

const powershell = existsSync("C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe")
  ? "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
  : "powershell";

const result = spawnSync(
  powershell,
  ["-ExecutionPolicy", "Bypass", "-File", powershellScript],
  {
    cwd: projectRoot,
    stdio: "inherit",
    shell: false,
  },
);

if (result.error) {
  console.error(`Failed to run PowerShell: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
