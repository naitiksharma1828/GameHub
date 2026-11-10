#!/usr/bin/env bash
# Compile the C++ backend into a WebAssembly module (ES6) that the
# frontend imports. Output is placed in ../public/wasm so Vite can
# bundle/serve it. Backend and frontend are built separately here and
# joined at the final Vite build step.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Ensure emscripten is on PATH (activated by the root build script).
if ! command -v em++ >/dev/null 2>&1; then
  echo "error: em++ not found. Activate emsdk before running." >&2
  exit 1
fi

OUT_DIR="../public/wasm"
mkdir -p "$OUT_DIR"

echo "Compiling C++ backend -> WASM ..."
em++ \
  -std=c++17 \
  -O3 \
  -Iinclude \
  src/sudoku.cpp \
  src/tictactoe.cpp \
  src/puzzle.cpp \
  src/chess.cpp \
  src/bindings.cpp \
  -lembind \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s EXPORT_NAME=createGamesModule \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s ENVIRONMENT=web \
  -s SINGLE_FILE=1 \
  -o "$OUT_DIR/games.js"

echo "Backend build complete: $OUT_DIR/games.js"
