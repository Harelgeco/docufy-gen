import { useSyncExternalStore } from "react";

// Keeps the uploaded Word template shared between Excel and manual modes (in memory only).
let current: File | undefined;
const listeners = new Set<() => void>();

export function setSharedWordFile(file: File | undefined) {
  current = file;
  listeners.forEach((l) => l());
}

export function useSharedWordFile(): [File | undefined, (f: File | undefined) => void] {
  const file = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => current
  );
  return [file, setSharedWordFile];
}
