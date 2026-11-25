import "fake-indexeddb/auto";
import { test } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import { saveIssueDraft, readIssueDraft, claimIssue, deleteIssueDraft, RECOVERY_TTL, type IssueDraft } from "./issueRecovery";

const draft: IssueDraft = {
  kind: "excel", wordFile: new File(["word bytes"], "marked.docx"),
  excelFile: new File(["excel bytes"], "people.xlsx"), language: "he",
  excelData: [{ Name: "Harel", City: "Tel Aviv" }, { Name: "Dana", City: "Haifa" }],
  selectedNames: ["Dana"], nameColumn: "Name",
};

test("redirect/new-tab recovery preserves all records, selected names and files", async () => {
  const id = await saveIssueDraft(draft, "word");
  const restored = await readIssueDraft(id);
  deepStrictEqual(restored?.excelData, draft.excelData);
  deepStrictEqual(restored?.selectedNames, ["Dana"]);
  strictEqual(restored?.nameColumn, "Name");
  strictEqual(await restored?.wordFile.text(), "word bytes");
  strictEqual(await restored?.excelFile?.text(), "excel bytes");
  await deleteIssueDraft(id);
});

test("manual recovery preserves field values and image bytes", async () => {
  const manual: IssueDraft = { kind: "manual", wordFile: draft.wordFile, language: "en", fieldValues: { Name: "Harel" }, images: [{ id: "photo", file: new File(["image bytes"], "photo.png"), preview: "blob:expired" }] };
  const id = await saveIssueDraft(manual, "pdf");
  const restored = await readIssueDraft(id);
  deepStrictEqual(restored?.fieldValues, { Name: "Harel" });
  strictEqual(await restored?.images?.[0].file.text(), "image bytes");
  await deleteIssueDraft(id);
});

test("verification and two tabs may resume an intent only once", async () => {
  const id = await saveIssueDraft(draft, "pdf");
  const results = await Promise.all([claimIssue(id), claimIssue(id)]);
  strictEqual(results.filter((format) => format === "pdf").length, 1);
  strictEqual(await claimIssue(id), undefined);
  await deleteIssueDraft(id);
});

test("cancelling the intent retains work, completion deletes the local copy", async () => {
  const id = await saveIssueDraft(draft, "word");
  await claimIssue(id);
  strictEqual(await claimIssue(id), undefined);
  deepStrictEqual((await readIssueDraft(id))?.selectedNames, ["Dana"]);
  await deleteIssueDraft(id);
  strictEqual(await readIssueDraft(id), undefined);
});

test("expired recovery cannot restore documents or issue downloads", async () => {
  const id = await saveIssueDraft(draft, "pdf");
  const now = Date.now;
  Date.now = () => now() + RECOVERY_TTL + 1;
  try {
    strictEqual(await readIssueDraft(id), undefined);
    strictEqual(await claimIssue(id), undefined);
  } finally { Date.now = now; }
});