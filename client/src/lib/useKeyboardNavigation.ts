import { useEffect } from "react";
import type { Entry } from "../types";

export function useKeyboardNav(
  entries: Entry[] | null,
  currentId: number | null,
  onSelect: (entry: Entry) => void,
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key !== "j" &&
        e.key !== "k" &&
        e.key !== "ArrowDown" &&
        e.key !== "ArrowUp"
      ) {
        return;
      }

      e.preventDefault();

      if (!entries || entries.length === 0) return;

      const currentInd = currentId
        ? entries.findIndex((e) => e.id === currentId)
        : -1;

      if (e.key === "j" || e.key === "ArrowDown") {
        const ind =
          currentInd === -1 ? 0 : Math.min(currentInd + 1, entries.length - 1);
        const e = entries[ind];
        if (e) {
          onSelect(e);
        }
      } else if (e.key === "k" || e.key === "ArrowUp") {
        if (currentInd > 0) {
          const e = entries[currentInd - 1];
          if (e) {
            onSelect(e);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [entries, currentId, onSelect]);
}
