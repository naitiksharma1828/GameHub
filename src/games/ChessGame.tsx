import { useEffect, useMemo, useRef, useState } from "react";
import type { ChessEngineInstance, GamesModule } from "../engine/wasm";

const GLYPHS: Record<string, string> = {
  P: "♙", N: "♘", B: "♗", R: "♖", Q: "♕", K: "♔",
  p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚",
};

function sqName(i: number) {
  return String.fromCharCode(97 + (i % 8)) + (8 - Math.floor(i / 8));
}

export function ChessGame({ engine }: { engine: GamesModule }) {
  const engineRef = useRef<ChessEngineInstance | null>(null);
  const [board, setBoard] = useState<string>("");
  const [turn, setTurn] = useState("w");
  const [selected, setSelected] = useState<number | null>(null);
  const [targets, setTargets] = useState<number[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [statusMsg, setStatusMsg] = useState("White to move");
  const [promotion, setPromotion] = useState<{ from: number; to: number } | null>(null);

  const sync = () => {
    const e = engineRef.current!;
    setBoard(e.board());
    setTurn(e.turn());
    setHistory(e.history());
    if (e.inCheckmate()) setStatusMsg(`Checkmate — ${e.turn() === "w" ? "Black" : "White"} wins!`);
    else if (e.inStalemate()) setStatusMsg("Stalemate — draw");
    else if (e.inCheck()) setStatusMsg(`${e.turn() === "w" ? "White" : "Black"} in check`);
    else setStatusMsg(`${e.turn() === "w" ? "White" : "Black"} to move`);
  };

  useEffect(() => {
    const e = new engine.ChessEngine();
    engineRef.current = e;
    setBoard(e.board());
    setTurn(e.turn());
    return () => {
      e.delete();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gameOver = useMemo(
    () => statusMsg.includes("wins") || statusMsg.includes("draw"),
    [statusMsg],
  );

  const onSquare = (i: number) => {
    const e = engineRef.current;
    if (!e || gameOver) return;

    if (selected === null) {
      const piece = board[i];
      if (piece === "." ) return;
      const isWhite = piece === piece.toUpperCase();
      if ((turn === "w") !== isWhite) return;
      const moves = e.movesFrom(i);
      if (moves.length === 0) return;
      setSelected(i);
      setTargets(moves.map((m) => m.to));
      return;
    }

    if (i === selected) {
      setSelected(null);
      setTargets([]);
      return;
    }

    if (targets.includes(i)) {
      // Detect promotion (pawn reaching last rank).
      const piece = board[selected];
      const toRank = Math.floor(i / 8);
      if (piece.toLowerCase() === "p" && (toRank === 0 || toRank === 7)) {
        setPromotion({ from: selected, to: i });
        return;
      }
      if (e.move(selected, i, "")) {
        setSelected(null);
        setTargets([]);
        sync();
      }
      return;
    }

    // Reselect another own piece.
    const piece = board[i];
    if (piece !== ".") {
      const isWhite = piece === piece.toUpperCase();
      if ((turn === "w") === isWhite) {
        const moves = e.movesFrom(i);
        setSelected(i);
        setTargets(moves.map((m) => m.to));
        return;
      }
    }
    setSelected(null);
    setTargets([]);
  };

  const finishPromotion = (p: string) => {
    const e = engineRef.current;
    if (!e || !promotion) return;
    e.move(promotion.from, promotion.to, p);
    setPromotion(null);
    setSelected(null);
    setTargets([]);
    sync();
  };

  const reset = () => {
    engineRef.current?.reset();
    setSelected(null);
    setTargets([]);
    sync();
  };

  const downloadPgn = () => {
    const moves = history;
    let pgn = "";
    for (let i = 0; i < moves.length; i += 2) {
      pgn += `${i / 2 + 1}. ${moves[i]} ${moves[i + 1] ?? ""} `;
    }
    const blob = new Blob([pgn.trim()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "game.pgn";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
      <div className="flex flex-col items-center gap-3">
        <div aria-live="polite" className="text-lg font-bold text-white">
          {statusMsg}
        </div>
        <div
          className="grid grid-cols-8 overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/20"
          role="grid"
          aria-label="Chess board"
        >
          {board.split("").map((piece, i) => {
            const dark = (Math.floor(i / 8) + i) % 2 === 1;
            const isSel = selected === i;
            const isTarget = targets.includes(i);
            return (
              <button
                key={i}
                onClick={() => onSquare(i)}
                aria-label={`${sqName(i)}${piece !== "." ? `, ${piece}` : ""}`}
                className="relative flex h-11 w-11 items-center justify-center text-3xl transition-colors sm:h-14 sm:w-14 sm:text-4xl"
                style={{
                  background: isSel
                    ? "rgba(16,185,129,0.7)"
                    : dark
                      ? "#4b7a5a"
                      : "#e8efe4",
                  color: piece === piece.toLowerCase() ? "#111" : "#fff",
                  textShadow: piece !== piece.toLowerCase() ? "0 1px 2px rgba(0,0,0,0.5)" : "none",
                }}
              >
                {isTarget && (
                  <span
                    className="absolute rounded-full"
                    style={{
                      width: piece === "." ? "28%" : "80%",
                      height: piece === "." ? "28%" : "80%",
                      background: piece === "." ? "rgba(16,185,129,0.6)" : "transparent",
                      border: piece !== "." ? "3px solid rgba(16,185,129,0.85)" : "none",
                    }}
                  />
                )}
                <span className="relative z-10">{GLYPHS[piece] ?? ""}</span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            New Game
          </button>
          <button
            onClick={downloadPgn}
            disabled={history.length === 0}
            className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-40"
          >
            Download PGN
          </button>
        </div>
      </div>

      {/* Move list */}
      <div className="w-full max-w-xs rounded-2xl bg-black/30 p-4 lg:w-56">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-white/60">
          Moves
        </h3>
        <ol className="grid max-h-72 grid-cols-2 gap-x-3 gap-y-1 overflow-y-auto text-sm text-white/80">
          {history.map((m, i) => (
            <li key={i} className="tabular-nums">
              {i % 2 === 0 && <span className="text-white/40">{i / 2 + 1}. </span>}
              {m}
            </li>
          ))}
          {history.length === 0 && (
            <li className="col-span-2 text-white/30">No moves yet</li>
          )}
        </ol>
      </div>

      {/* Promotion dialog */}
      {promotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rounded-2xl bg-slate-800 p-6 text-center">
            <p className="mb-4 font-bold text-white">Promote to:</p>
            <div className="flex gap-3">
              {["q", "r", "b", "n"].map((p) => (
                <button
                  key={p}
                  onClick={() => finishPromotion(p)}
                  className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/10 text-4xl text-white transition hover:bg-emerald-500"
                >
                  {GLYPHS[turn === "w" ? p.toUpperCase() : p]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
