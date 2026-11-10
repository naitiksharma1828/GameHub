import { useEffect, useRef, useState } from "react";
import type { GamesModule } from "../engine/wasm";

const N = 3;

export function PuzzleGame({ engine }: { engine: GamesModule }) {
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [solving, setSolving] = useState(false);
  const solveTimers = useRef<number[]>([]);

  const shuffle = () => {
    clearTimers();
    setSolving(false);
    const seed = Math.floor(Math.random() * 2 ** 31);
    setBoard(engine.puzzleShuffle(N, seed));
    setMoves(0);
  };

  const clearTimers = () => {
    solveTimers.current.forEach((t) => clearTimeout(t));
    solveTimers.current = [];
  };

  useEffect(() => {
    shuffle();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const solved =
    board.length > 0 && board.every((v, i) => v === (i === board.length - 1 ? 0 : i + 1) % board.length);
  // goal here: tile v at index v, blank(0) at index 0 -> matches engine goal [0,1,2,...]
  const isSolved =
    board.length > 0 && board.every((v, i) => v === i);

  const blank = board.indexOf(0);

  const canMove = (i: number) => {
    const r = Math.floor(i / N),
      c = i % N;
    const br = Math.floor(blank / N),
      bc = blank % N;
    return Math.abs(r - br) + Math.abs(c - bc) === 1;
  };

  const slide = (i: number) => {
    if (solving || !canMove(i)) return;
    const next = [...board];
    [next[i], next[blank]] = [next[blank], next[i]];
    setBoard(next);
    setMoves((m) => m + 1);
  };

  const autoSolve = () => {
    if (solving) return;
    const sequence = engine.puzzleSolve(board, N); // tiles that slide, in order
    if (!sequence.length) return;
    setSolving(true);
    let current = [...board];
    sequence.forEach((tile, step) => {
      const t = window.setTimeout(() => {
        const idx = current.indexOf(tile);
        const b = current.indexOf(0);
        const nb = [...current];
        [nb[idx], nb[b]] = [nb[b], nb[idx]];
        current = nb;
        setBoard(nb);
        setMoves((m) => m + 1);
        if (step === sequence.length - 1) setSolving(false);
      }, step * 250);
      solveTimers.current.push(t);
    });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-6 text-white/80">
        <span className="text-sm">Moves: <b className="text-white">{moves}</b></span>
        {isSolved && !solving && (
          <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">Solved! ✓</span>
        )}
      </div>

      <div
        className="grid gap-2 rounded-2xl bg-white/10 p-2 shadow-2xl"
        style={{ gridTemplateColumns: `repeat(${N}, 5rem)` }}
        role="grid"
        aria-label="Sliding puzzle"
      >
        {board.map((v, i) => (
          <button
            key={i}
            onClick={() => slide(i)}
            disabled={v === 0 || solving}
            aria-label={v === 0 ? "Empty space" : `Tile ${v}`}
            className={`flex h-20 w-20 items-center justify-center rounded-xl text-2xl font-black transition-all duration-200 ${
              v === 0
                ? "bg-transparent"
                : "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg hover:brightness-110"
            } ${canMove(i) && v !== 0 && !solving ? "ring-2 ring-white/40" : ""}`}
          >
            {v || ""}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={autoSolve}
          disabled={solving || isSolved}
          className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-40"
        >
          {solving ? "Solving…" : "A* Auto-Solve"}
        </button>
        <button
          onClick={shuffle}
          className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-400"
        >
          Shuffle
        </button>
      </div>
      <p className="max-w-xs text-center text-xs text-white/40">
        {solved ? "" : "Click a tile adjacent to the empty space to slide it."}
      </p>
    </div>
  );
}
