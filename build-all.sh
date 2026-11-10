#!/usr/bin/env bash
# ============================================================
#  Full build pipeline — joins the separate BACKEND (C++/WASM)
#  and FRONTEND (React/Vite) into one deployable artifact.
#
#  Stage 1: compile the C++ backend -> public/wasm/games.js
#  Stage 2: build the React frontend, which imports that module
#           and Vite inlines everything into dist/index.html
# ============================================================
set -e

echo "==> Stage 1/2 : Building C++ backend (WebAssembly)"

# Activate Emscripten if an emsdk path is provided.
if [ -n "${EMSDK_PATH:-}" ] && [ -f "${EMSDK_PATH}/emsdk_env.sh" ]; then
  # shellcheck disable=SC1091
  source "${EMSDK_PATH}/emsdk_env.sh"
fi

if command -v em++ >/dev/null 2>&1; then
  bash backend/build.sh
else
  if [ -f public/wasm/games.js ]; then
    echo "warning: em++ not found — reusing existing public/wasm/games.js"
  else
    echo "error: em++ not found and no prebuilt WASM present." >&2
    echo "       Install Emscripten or set EMSDK_PATH." >&2
    exit 1
  fi
fi

echo "==> Stage 2/2 : Building React frontend (Vite)"
npm run build

echo "==> Done. Deployable output is in dist/"
