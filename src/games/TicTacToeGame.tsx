import { useEffect, useState } from "react";
import type { GamesModule } from "../engine/wasm";

type Mode = "pvp" | "ai";

export function TicTacToeGame({ engine }: { engine: GamesModule }) {
  const [board, setBoard] = useState<number[]>(Array(9).fill(0));
  const [turn, setTurn] = useState(1); // 1 = X, 2 = O
  const [mode, setMode] = useState<Mode>("ai");
  const [status, setStatus] = useState(0);
  const [scores, setScores] = useState({ x: 0, o: 0, draw: 0 });

  const reset = () => {
    setBoard(Array(9).fill(0));
    setTurn(1);
    setStatus(0);
  };

  const play = (i: number) => {
    if (board[i] !== 0 || status !== 0) return;
    const next = [...board];
    next[i] = turn;
    setBoard(next);
    const st = engine.tttStatus(next);
    setStatus(st);
    if (st === 0) setTurn(turn === 1 ? 2 : 1);
    else recordScore(st);
  };

  const recordScore = (st: number) => {
    setScores((s) => ({
      x: s.x + (st === 1 ? 1 : 0),
      o: s.o + (st === 2 ? 1 : 0),
      draw: s.draw + (st === 3 ? 1 : 0),
    }));
  };

  // AI moves as O.
  useEffect(() => {
    if (mode !== "ai" || turn !== 2 || status !== 0) return;
    const t = setTimeout(() => {
      const move = engine.tttBestMove(board, 2);
      if (move >= 0) {
        const next = [...board];
        next[move] = 2;
        setBoard(next);
        const st = engine.tttStatus(next);
        setStatus(st);
        if (st === 0) setTurn(1);
        else recordScore(st);
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, mode, status, board]);

  const msg =
    status === 1
      ? "X wins!"
      : status === 2
        ? mode === "ai"
          ? "AI wins!"
          : "O wins!"
        : status === 3
          ? "Draw"
          : `${turn === 1 ? "X" : "O"} to move`;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2">
        {(["ai", "pvp"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              reset();
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              mode === m ? "bg-rose-500 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {m === "ai" ? "vs Unbeatable AI" : "2 Players"}
          </button>
        ))}
      </div>

      <div
        aria-live="polite"
        className="text-xl font-bold text-white"
      >
        {msg}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {board.map((c, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            disabled={c !== 0 || status !== 0 || (mode === "ai" && turn === 2)}
            aria-label={`Cell ${i + 1}${c === 1 ? ", X" : c === 2 ? ", O" : ", empty"}`}
            className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 text-5xl font-black transition hover:bg-white/20 disabled:cursor-not-allowed"
            style={{ color: c === 1 ? "#fb7185" : "#f0abfc" }}
          >
            {c === 1 ? "X" : c === 2 ? "O" : ""}
          </button>
        ))}
      </div>

      <div className="flex gap-6 text-sm text-white/70">
        <span>❌ {scores.x}</span>
        <span>🤝 {scores.draw}</span>
        <span>⭕ {scores.o}</span>
      </div>

      <button
        onClick={reset}
        className="rounded-full bg-rose-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
      >
        New Round
      </button>
    </div>
  );
}
