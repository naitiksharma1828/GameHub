// Frontend bridge to the C++ (WASM) backend.
// The backend is compiled separately (see /backend) and imported here.
// @ts-expect-error - generated Emscripten module has no type declarations
import createGamesModule from "../../public/wasm/games.js";

export interface ChessMoveDTO {
  from: number;
  to: number;
  promotion: string;
}

export interface ChessEngineInstance {
  reset(): void;
  loadFen(fen: string): boolean;
  fen(): string;
  board(): string;
  turn(): string;
  move(from: number, to: number, promo: string): boolean;
  movesFrom(sq: number): ChessMoveDTO[];
  legalCount(): number;
  inCheck(): boolean;
  inCheckmate(): boolean;
  inStalemate(): boolean;
  isGameOver(): boolean;
  history(): string[];
  delete(): void;
}

export interface GamesModule {
  sudokuGenerate(seed: number, clues: number): { puzzle: number[]; solution: number[] };
  sudokuSolve(grid: number[]): number[];
  sudokuValid(grid: number[], idx: number, val: number): boolean;
  tttStatus(board: number[]): number;
  tttBestMove(board: number[], player: number): number;
  puzzleShuffle(n: number, seed: number): number[];
  puzzleSolvable(board: number[], n: number): boolean;
  puzzleSolve(board: number[], n: number): number[];
  ChessEngine: new () => ChessEngineInstance;
}

let modulePromise: Promise<GamesModule> | null = null;

/** Lazily load and cache the WebAssembly backend module. */
export function loadEngine(): Promise<GamesModule> {
  if (!modulePromise) {
    modulePromise = createGamesModule() as Promise<GamesModule>;
  }
  return modulePromise;
}
