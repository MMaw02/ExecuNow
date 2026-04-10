#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/desktop"

echo "Verificando pnpm con Corepack..."
corepack pnpm --version

if [ ! -d "$APP_DIR" ]; then
  echo "No existe '$APP_DIR'. Creando proyecto Tauri..."
  corepack pnpm create tauri-app@latest "$APP_DIR"
else
  echo "La carpeta '$APP_DIR' ya existe. Se omite la creación."
fi

cd "$APP_DIR"

echo "Instalando dependencias..."
corepack pnpm install

echo "Iniciando Tauri en modo desarrollo..."
corepack pnpm tauri dev