import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
import { repeatedEdits } from "./demoMetrics";

describe("manual document repetition", () => {
  test("30 people with 10 changed fields require 300 field replacements", () => {
    assert.equal(repeatedEdits(30, 10), 300);
  });
  test("changing the number of people changes the replacement count", () => {
    assert.equal(repeatedEdits(60, 10), 600);
  });
});