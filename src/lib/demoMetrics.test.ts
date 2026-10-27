import { describe, expect, test } from "bun:test";
import { repeatedEdits } from "./demoMetrics";

describe("manual document repetition", () => {
  test("30 people with 10 changed fields require 300 field replacements", () => {
    expect(repeatedEdits(30, 10)).toBe(300);
  });
  test("changing the number of people changes the replacement count", () => {
    expect(repeatedEdits(60, 10)).toBe(600);
  });
});