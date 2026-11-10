import { useEffect, useState } from "react";
import { GameCarousel } from "./components/GameCarousel";
import { GamePage } from "./components/GamePage";
import type { GameId } from "./data/games";

const VALID: GameId[] = ["sudoku", "tictactoe", "puzzle", "chess"];

function parseHash(): GameId | null {
  const h = window.location.hash.replace(/^#\/?/, "");
  return (VALID as string[]).includes(h) ? (h as GameId) : null;
}

export default function App() {
  const [route, setRoute] = useState<GameId | null>(parseHash());

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const launch = (id: GameId) => {
    window.location.hash = `/${id}`;
    setRoute(id);
  };

  const back = () => {
    window.location.hash = "";
    setRoute(null);
  };

  if (route) return <GamePage id={route} onBack={back} />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* PS5-style ambient backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 rounded-full bg-cyan-600/20 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col">
        <header className="px-8 pt-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">
            WebAssembly Arcade
          </p>
          <h1 className="mt-2 bg-gradient-to-r from-white via-indigo-200 to-fuchsia-200 bg-clip-text text-4xl font-black text-transparent sm:text-6xl">
            Game Hub
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
            Four mini-games powered by a hand-written C++ engine compiled to
            WebAssembly. Hover, use arrow keys, or a PS5 controller to browse —
            then press to play.
          </p>
        </header>

        <div className="flex flex-1 flex-col justify-center py-6">
          <GameCarousel onLaunch={launch} />
        </div>

        <footer className="px-8 pb-6 text-center text-xs text-white/30">
          C++ backend · React + Vite frontend · Built &amp; joined via WASM
        </footer>
      </div>
    </div>
  );
}
