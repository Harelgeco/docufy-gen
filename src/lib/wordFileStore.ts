import { useSyncExternalStore } from "react";

// Keeps the uploaded Word template shared between Excel and manual modes.
// The edited template is also mirrored into sessionStorage so that a page
// refresh (or coming back to the tab) restores the same document with the
// fields already marked, instead of forcing the user to start over.

const KEY = "docufy:shared-word-file";
const MAX_PERSIST_BYTES = 6 * 1024 * 1024;

let current: File | undefined;
const listeners = new Set<() => void>();

function toBase64(bytes: Uint8Array) {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)) as unknown as number[]);
  }
  return btoa(bin);
}

function fromBase64(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function persist(file: File | undefined) {
  try {
    if (!file) {
      sessionStorage.removeItem(KEY);
      return;
    }
    if (file.size > MAX_PERSIST_BYTES) {
      sessionStorage.removeItem(KEY);
      return;
    }
    file
      .arrayBuffer()
      .then((buf) => {
        sessionStorage.setItem(
          KEY,
          JSON.stringify({ name: file.name, type: file.type, data: toBase64(new Uint8Array(buf)) })
        );
      })
      .catch(() => {});
  } catch {
    // storage full or unavailable: the in-memory copy still works for this tab
  }
}

function restore() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { name: string; type: string; data: string };
    if (!parsed?.data) return;
    current = new File([fromBase64(parsed.data)], parsed.name, { type: parsed.type });
  } catch {
    sessionStorage.removeItem(KEY);
  }
}

restore();

export function setSharedWordFile(file: File | undefined) {
  current = file;
  persist(file);
  listeners.forEach((l) => l());
}

export function useSharedWordFile(): [File | undefined, (f: File | undefined) => void] {
  const file = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current
  );
  return [file, setSharedWordFile];
}
