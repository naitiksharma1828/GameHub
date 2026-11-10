# WASM Game Hub — C++ Arcade

A PS5-home-screen-style single-page app hosting four mini-games. **All game
logic lives in a hand-written C++ backend** that is compiled to WebAssembly and
consumed by a React + Vite + Tailwind frontend. Backend and frontend are kept
in **separate source trees** and **joined only at build time**.

## Games

| Game | Backend responsibility (C++) |
|------|------------------------------|
| **Sudoku** | Backtracking generator/solver with MRV heuristic + uniqueness check |
| **Tic-Tac-Toe** | Minimax AI (unbeatable) + win/draw detection |
| **Sliding Puzzle** | Solvable-shuffle (inversion parity) + A* auto-solver (Manhattan) |
| **Chess** | Full legal move generation — castling, en passant, promotion, check / checkmate / stalemate |

## Project layout (backend & frontend are separate)

```
backend/                # C++ ONLY — no other backend language is used
├── include/            #   engine headers
│   ├── sudoku.h  tictactoe.h  puzzle.h  chess.h
├── src/                #   engine implementations
│   ├── sudoku.cpp  tictactoe.cpp  puzzle.cpp  chess.cpp
│   └── bindings.cpp    #   the single Emscripten (embind) bridge to JS
└── build.sh            #   compiles the above -> public/wasm/games.js (SINGLE_FILE)

src/                    # FRONTEND (React + TypeScript)
├── engine/             #   thin TS wrapper + React hook around the WASM module
├── components/         #   PS5-style carousel, previews, game page, routing
├── games/              #   React UI for each game (calls into the C++ engine)
└── data/games.ts       #   game catalog metadata

build-all.sh            # joins the two: builds backend -> then frontend
```

## Building

The two halves are built independently and merged by Vite (which inlines the
WASM + JS + CSS into a single `dist/index.html`).

```bash
# 1. Backend (needs Emscripten's em++ on PATH)
bash backend/build.sh          # -> public/wasm/games.js

# 2. Frontend
npm install
npm run build                  # -> dist/index.html (everything inlined)

# …or do both at once:
EMSDK_PATH=/path/to/emsdk bash build-all.sh
```

## How the join works

`backend/build.sh` emits an ES6, single-file (`-s SINGLE_FILE=1`) module at
`public/wasm/games.js` with the `.wasm` embedded as base64. The frontend imports
it through `src/engine/wasm.ts`, and Vite's single-file plugin inlines the whole
thing into the final HTML — no runtime network fetch for the engine.

## Accessibility

- Every tile / cell is a real `<button>` with an `aria-label`.
- Full keyboard navigation (arrow keys, Home/End, Enter/Space).
- **Gamepad** support (PS5 controller) via the Gamepad API.
- `aria-live` regions announce game status.
- `prefers-reduced-motion` disables the live-tile animations.
