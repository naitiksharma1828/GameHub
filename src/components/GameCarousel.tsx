import { useCallback, useEffect, useRef, useState } from "react";
import { GAMES, type GameId } from "../data/games";
import { GamePreview } from "./Previews";

interface Props {
  onLaunch: (id: GameId) => void;
}

export function GameCarousel({ onLaunch }: Props) {
  const [focused, setFocused] = useState(0);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const gamepadPrev = useRef(0);

  const focusIndex = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(GAMES.length - 1, i));
    setFocused(clamped);
    btnRefs.current[clamped]?.focus();
  }, []);

  // Keyboard arrow navigation.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusIndex(focused + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusIndex(focused - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusIndex(GAMES.length - 1);
    }
  };

  // Gamepad (PS5 controller) navigation via requestAnimationFrame polling.
  useEffect(() => {
    let raf = 0;
    const poll = () => {
      const pads = navigator.getGamepads?.() ?? [];
      const pad = pads.find((p) => p);
      if (pad) {
        const now = performance.now();
        const axisX = pad.axes[0] ?? 0;
        const dpadRight = pad.buttons[15]?.pressed;
        const dpadLeft = pad.buttons[14]?.pressed;
        const cross = pad.buttons[0]?.pressed; // X button
        if (now - gamepadPrev.current > 220) {
          if (axisX > 0.5 || dpadRight) {
            focusIndex(focused + 1);
            gamepadPrev.current = now;
          } else if (axisX < -0.5 || dpadLeft) {
            focusIndex(focused - 1);
            gamepadPrev.current = now;
          } else if (cross) {
            onLaunch(GAMES[focused].id);
            gamepadPrev.current = now + 400;
          }
        }
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [focused, focusIndex, onLaunch]);

  return (
    <div
      role="region"
      aria-label="Game library"
      className="w-full"
      onKeyDown={onKeyDown}
    >
      <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-2 pb-10 pt-4 md:justify-center md:overflow-visible">
        {GAMES.map((game, i) => {
          const active = i === focused;
          return (
            <button
              key={game.id}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              aria-label={`${game.title}. ${game.subtitle}. ${game.description} Press Enter to play.`}
              onMouseEnter={() => setFocused(i)}
              onFocus={() => setFocused(i)}
              onClick={() => onLaunch(game.id)}
              className={`group relative flex h-[22rem] w-64 shrink-0 snap-center flex-col overflow-hidden rounded-3xl border text-left outline-none transition-all duration-500 ease-out motion-reduce:transition-none ${
                active
                  ? "scale-105 border-white/40"
                  : "scale-95 border-white/10 opacity-70 hover:opacity-100"
              }`}
              style={{
                boxShadow: active
                  ? `0 0 40px rgba(${game.glow},0.55), 0 20px 60px rgba(0,0,0,0.5)`
                  : "0 10px 30px rgba(0,0,0,0.4)",
              }}
            >
              {/* Base gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${game.accent} opacity-90`}
              />
              <div className="absolute inset-0 bg-black/25" />

              {/* Live preview overlay on focus/hover */}
              <div
                className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/55 backdrop-blur-sm transition-opacity duration-500 motion-reduce:transition-none ${
                  active
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                }`}
              >
                <GamePreview id={game.id} />
                <span className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-black">
                  ▶ Play
                </span>
              </div>

              {/* Static card content */}
              <div className="relative z-0 flex flex-1 flex-col justify-between p-6">
                <div className="text-5xl drop-shadow-lg">{game.emoji}</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    {game.subtitle}
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-white drop-shadow">
                    {game.title}
                  </h3>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Description of focused tile */}
      <div className="mx-auto max-w-2xl px-4 text-center" aria-live="polite">
        <p className="min-h-[3rem] text-sm leading-relaxed text-white/60">
          {GAMES[focused].description}
        </p>
      </div>
    </div>
  );
}
