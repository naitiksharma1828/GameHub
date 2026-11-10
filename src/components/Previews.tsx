import type { GameId } from "../data/games";

/**
 * Lightweight animated previews shown on hover/focus — mimicking the
 * PS5 home-screen live tiles. Pure CSS/SVG so they are tiny and crisp.
 */
export function GamePreview({ id }: { id: GameId }) {
  switch (id) {
    case "sudoku":
      return <SudokuPreview />;
    case "tictactoe":
      return <TicTacToePreview />;
    case "puzzle":
      return <PuzzlePreview />;
    case "chess":
      return <ChessPreview />;
  }
}

function SudokuPreview() {
  const nums = [5, 3, 0, 0, 7, 0, 6, 0, 1, 9, 0, 8, 0, 0, 4, 0, 2];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-sm font-bold text-white backdrop-blur"
          style={{
            animation: `pop 2.4s ease-in-out ${i * 0.12}s infinite`,
          }}
        >
          {nums[i] || ""}
        </div>
      ))}
    </div>
  );
}

function TicTacToePreview() {
  const marks = ["X", "O", "X", "", "X", "O", "O", "", "X"];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {marks.map((m, i) => (
        <div
          key={i}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-lg font-black backdrop-blur"
          style={{
            color: m === "X" ? "#fb7185" : "#f0abfc",
            animation: m ? `fadeScale 2s ease-in-out ${i * 0.1}s infinite` : "none",
          }}
        >
          {m}
        </div>
      ))}
    </div>
  );
}

function PuzzlePreview() {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {[1, 2, 3, 4, 0, 6, 7, 5, 8].map((n, i) => (
        <div
          key={i}
          className="flex h-9 w-9 items-center justify-center rounded-md text-sm font-bold text-white"
          style={{
            background: n ? "rgba(245,158,11,0.35)" : "transparent",
            animation: n === 5 ? "slideTile 1.8s ease-in-out infinite" : "none",
          }}
        >
          {n || ""}
        </div>
      ))}
    </div>
  );
}

function ChessPreview() {
  const pieces = ["♜", "♞", "♝", "♛", "♚", "♟", "♙", "♖"];
  return (
    <div className="grid grid-cols-4 gap-0 overflow-hidden rounded-md">
      {Array.from({ length: 16 }).map((_, i) => {
        const dark = (Math.floor(i / 4) + i) % 2 === 0;
        return (
          <div
            key={i}
            className="flex h-8 w-8 items-center justify-center text-lg"
            style={{
              background: dark ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.12)",
            }}
          >
            <span
              style={{
                animation:
                  i % 5 === 0 ? `floatPiece 2.2s ease-in-out ${i * 0.1}s infinite` : "none",
              }}
            >
              {i % 3 === 0 ? pieces[i % pieces.length] : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
