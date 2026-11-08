import { describe, it, expect } from "bun:test";
import { checkIssueAllowance } from "./quota";

describe("free tier monthly allowance", () => {
  it("allows 3 documents for a fresh free user", () => {
    expect(checkIssueAllowance("free", 0, 3)).toEqual({ allowed: true, remaining: 3 });
  });
  it("blocks 4 documents for a fresh free user", () => {
    expect(checkIssueAllowance("free", 0, 4).allowed).toBe(false);
  });
  it("leaves 2 after issuing 1", () => {
    expect(checkIssueAllowance("free", 1, 2)).toEqual({ allowed: true, remaining: 2 });
    expect(checkIssueAllowance("free", 1, 3).allowed).toBe(false);
  });
  it("paid tiers are not limited", () => {
    expect(checkIssueAllowance("pro", 50, 100).allowed).toBe(true);
  });
});
