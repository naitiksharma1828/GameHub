import { GAMES, type GameId } from "../data/games";
import { useEngine } from "../engine/useEngine";
import { SudokuGame } from "../games/SudokuGame";
import { TicTacToeGame } from "../games/TicTacToeGame";
import { PuzzleGame } from "../games/PuzzleGame";
import { ChessGame } from "../games/ChessGame";

interface Props {
  id: GameId;
  onBack: () => void;
}

export function GamePage({ id, onBack }: Props) {
  const { engine, loading, error } = useEngine();
  const meta = GAMES.find((g) => g.id === id)!;

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-950">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at 50% 0%, rgba(${meta.glow},0.4), transparent 60%)`,
        }}
      />

      <header className="relative z-10 flex items-center gap-4 px-6 py-4">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Back to home"
        >
          <span className="text-lg transition-transform group-hover:-translate-x-0.5">←</span>
          Home
        </button>
        <h1 className="flex items-center gap-2 text-xl font-black text-white">
          <span>{meta.emoji}</span>
          {meta.title}
        </h1>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        {loading && (
          <div className="flex flex-col items-center gap-4 text-white/70">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm">Loading C++ engine (WebAssembly)…</p>
          </div>
        )}
        {error && (
          <div className="max-w-md rounded-xl bg-rose-500/20 p-6 text-center text-rose-200">
            <p className="font-bold">Failed to load engine</p>
            <p className="mt-2 text-xs">{error}</p>
          </div>
        )}
        {engine && !loading && (
          <>
            {id === "sudoku" && <SudokuGame engine={engine} />}
            {id === "tictactoe" && <TicTacToeGame engine={engine} />}
            {id === "puzzle" && <PuzzleGame engine={engine} />}
            {id === "chess" && <ChessGame engine={engine} />}
          </>
        )}
      </main>
    </div>
  );
}
