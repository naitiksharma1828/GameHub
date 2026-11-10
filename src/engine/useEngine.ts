import { useEffect, useState } from "react";
import { loadEngine, type GamesModule } from "./wasm";

interface EngineState {
  engine: GamesModule | null;
  loading: boolean;
  error: string | null;
}

/** React hook that loads the C++/WASM backend once and shares it. */
export function useEngine(): EngineState {
  const [state, setState] = useState<EngineState>({
    engine: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    loadEngine()
      .then((engine) => {
        if (alive) setState({ engine, loading: false, error: null });
      })
      .catch((err) => {
        if (alive)
          setState({ engine: null, loading: false, error: String(err) });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
