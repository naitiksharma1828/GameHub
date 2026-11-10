import { useEffect, useMemo, useState } from "react";
import type { GamesModule } from "../engine/wasm";

type Difficulty = "easy" | "medium" | "hard";
const CLUES: Record<Difficulty, number> = { easy: 40, medium: 32, hard: 26 };

export function SudokuGame({ engine }: { engine: GamesModule }) {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [puzzle, setPuzzle] = useState<number[]>([]);
  const [solution, setSolution] = useState<number[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [won, setWon] = useState(false);
  const [checkMode, setCheckMode] = useState(false);

  const newGame = (d: Difficulty) => {
    const seed = Math.floor(Math.random() * 2 ** 31);
    const res = engine.sudokuGenerate(seed, CLUES[d]);
    setPuzzle(res.puzzle);
    setSolution(res.solution);
    setValues([...res.puzzle]);
    setSelected(null);
    setSeconds(0);
    setWon(false);
    setCheckMode(false);
  };

  useEffect(() => {
    newGame(difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (won) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [won]);

  const setCell = (val: number) => {
    if (selected === null || puzzle[selected] !== 0) return;
    const next = [...values];
    next[selected] = val;
    setValues(next);
    if (next.every((v, i) => v === solution[i])) setWon(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selected === null) return;
      if (e.key >= "1" && e.key <= "9") setCell(Number(e.key));
      else if (e.key === "Backspace" || e.key === "0" || e.key === "Delete")
        setCell(0);
      else if (e.key === "ArrowRight") setSelected((s) => Math.min(80, (s ?? 0) + 1));
      else if (e.key === "ArrowLeft") setSelected((s) => Math.max(0, (s ?? 0) - 1));
      else if (e.key === "ArrowDown") setSelected((s) => Math.min(80, (s ?? 0) + 9));
      else if (e.key === "ArrowUp") setSelected((s) => Math.max(0, (s ?? 0) - 9));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, values, puzzle, solution]);

  const time = useMemo(() => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [seconds]);

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-5">
      <div className="flex w-full items-center justify-between text-white">
        <div className="flex gap-2">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDifficulty(d);
                newGame(d);
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                difficulty === d
                  ? "bg-indigo-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="font-mono text-sm tabular-nums text-white/80">⏱ {time}</div>
      </div>

      <div
        className="grid grid-cols-9 overflow-hidden rounded-lg bg-white/20 shadow-2xl"
        role="grid"
        aria-label="Sudoku board"
      >
        {values.map((v, i) => {
          const fixed = puzzle[i] !== 0;
          const isSel = selected === i;
          const wrong = checkMode && v !== 0 && v !== solution[i];
          const row = Math.floor(i / 9);
          const col = i % 9;
          return (
            <button
              key={i}
              role="gridcell"
              aria-label={`Row ${row + 1} column ${col + 1}${v ? `, value ${v}` : ", empty"}`}
              onClick={() => setSelected(i)}
              className={`flex h-9 w-9 items-center justify-center text-base font-semibold transition-colors sm:h-11 sm:w-11 sm:text-lg ${
                fixed ? "text-white" : "text-cyan-300"
              } ${wrong ? "bg-rose-600/80 text-white" : isSel ? "bg-indigo-500/70" : "bg-slate-800/80 hover:bg-slate-700"}`}
              style={{
                borderRight: (col + 1) % 3 === 0 && col !== 8 ? "2px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                borderBottom: (row + 1) % 3 === 0 && row !== 8 ? "2px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {v || ""}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => setCell(n)}
            className="h-10 w-10 rounded-lg bg-white/10 text-lg font-bold text-white transition hover:bg-indigo-500"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => setCell(0)}
          className="h-10 w-14 rounded-lg bg-white/10 text-sm font-bold text-white transition hover:bg-rose-500"
        >
          Erase
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setCheckMode((c) => !c)}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          {checkMode ? "Hide errors" : "Check"}
        </button>
        <button
          onClick={() => newGame(difficulty)}
          className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
        >
          New Game
        </button>
      </div>

      {won && (
        <div className="rounded-xl bg-emerald-500/90 px-6 py-3 text-center font-bold text-white shadow-lg">
          🎉 Solved in {time}!
        </div>
      )}
    </div>
  );
}
