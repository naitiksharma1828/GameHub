export type GameId = "sudoku" | "tictactoe" | "puzzle" | "chess";

export interface GameMeta {
  id: GameId;
  title: string;
  subtitle: string;
  description: string;
  accent: string; // gradient classes
  glow: string; // rgba glow color
  emoji: string;
}

export const GAMES: GameMeta[] = [
  {
    id: "sudoku",
    title: "Sudoku",
    subtitle: "Logic Puzzle",
    description:
      "Fill the 9×9 grid so every row, column and box contains 1–9. Boards are generated and verified for a unique solution by the C++ engine.",
    accent: "from-indigo-500 via-blue-600 to-cyan-500",
    glow: "99,102,241",
    emoji: "🔢",
  },
  {
    id: "tictactoe",
    title: "Tic-Tac-Toe",
    subtitle: "Classic Duel",
    description:
      "Play two-player hot-seat or challenge an unbeatable minimax AI running natively in WebAssembly.",
    accent: "from-rose-500 via-pink-600 to-fuchsia-500",
    glow: "244,63,94",
    emoji: "⭕",
  },
  {
    id: "puzzle",
    title: "Sliding Puzzle",
    subtitle: "Brain Teaser",
    description:
      "Slide numbered tiles into order. Solvable shuffles and an A* auto-solver are computed by the C++ backend.",
    accent: "from-amber-500 via-orange-600 to-red-500",
    glow: "245,158,11",
    emoji: "🧩",
  },
  {
    id: "chess",
    title: "Chess",
    subtitle: "Two-Player Strategy",
    description:
      "Full legal move generation, castling, en passant, promotion and checkmate detection — all in a hand-written C++ chess engine.",
    accent: "from-emerald-500 via-teal-600 to-green-500",
    glow: "16,185,129",
    emoji: "♞",
  },
];
