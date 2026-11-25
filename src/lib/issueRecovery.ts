import type { UploadedImage } from "@/components/ImageUploader";

export type IssueFormat = "pdf" | "word";
export type IssueDraft = {
  kind: "excel" | "manual";
  wordFile: File;
  language: "he" | "en";
  excelFile?: File;
  excelData?: Record<string, string>[];
  selectedNames?: string[];
  nameColumn?: string;
  fieldValues?: Record<string, string>;
  images?: UploadedImage[];
};
type Recovery = { id: string; expires: number; format?: IssueFormat; draft: IssueDraft };
export const RECOVERY_TTL = 24 * 60 * 60 * 1000;

// IndexedDB preserves File objects across redirects and same-origin tabs. Never sent to a server.
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("docufy-issue-recovery", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction<T>(run: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("drafts", "readwrite");
    let value: T;
    tx.oncomplete = () => { db.close(); resolve(value); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
    // Remove expired document content whenever recovery storage is accessed.
    const cursor = tx.objectStore("drafts").openCursor();
    cursor.onsuccess = () => {
      const entry = cursor.result;
      if (entry) {
        if ((entry.value as Recovery).expires <= Date.now()) entry.delete();
        entry.continue();
      } else run(tx.objectStore("drafts"), (next) => { value = next; });
    };
  });
}

export async function saveIssueDraft(draft: IssueDraft, format: IssueFormat, id: string = crypto.randomUUID()): Promise<string> {
  return transaction<string>((store, result) => {
    store.put({ id, draft, format, expires: Date.now() + RECOVERY_TTL } satisfies Recovery);
    result(id);
  });
}

export async function readIssueDraft(id: string): Promise<IssueDraft | undefined> {
  return transaction<IssueDraft | undefined>((store, result) => {
    const request = store.get(id);
    request.onsuccess = () => result((request.result as Recovery | undefined)?.draft);
  });
}

// Atomically take the intent so two email-verification tabs cannot download twice.
export async function claimIssue(id: string): Promise<IssueFormat | undefined> {
  return transaction<IssueFormat | undefined>((store, result) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const entry = request.result as Recovery | undefined;
      result(entry?.format);
      if (entry) store.put({ ...entry, format: undefined });
    };
  });
}

export async function deleteIssueDraft(id: string): Promise<void> {
  return transaction<void>((store, result) => { store.delete(id); result(undefined); });
}

export function recoveryId() {
  return new URLSearchParams(window.location.search).get("resumeIssue");
}

export function recoveryUrl(id: string) {
  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.set("resumeIssue", id);
  return url.href;
}