import { describe, test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { checkIssueAllowance } from "./quota";

describe("free tier monthly allowance", () => {
  test("allows 3 documents for a fresh free user", () => {
    deepStrictEqual(checkIssueAllowance("free", 0, 3), { allowed: true, remaining: 3 });
  });
  test("blocks 4 documents for a fresh free user", () => {
    strictEqual(checkIssueAllowance("free", 0, 4).allowed, false);
  });
  test("leaves 2 after issuing 1", () => {
    deepStrictEqual(checkIssueAllowance("free", 1, 2), { allowed: true, remaining: 2 });
    strictEqual(checkIssueAllowance("free", 1, 3).allowed, false);
  });
  test("paid tiers are not limited", () => {
    strictEqual(checkIssueAllowance("pro", 50, 100).allowed, true);
  });
});
