import { useEffect, useState } from "react";
import type { WebringData } from "./types";

export function useWebring() {
  const [data, setData] = useState<WebringData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/webring.json", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load webring.json (${res.status})`);
        return (await res.json()) as WebringData;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error };
}