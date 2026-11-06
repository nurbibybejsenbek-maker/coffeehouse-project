import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizePhone } from "../lib/utils";

describe("normalizePhone", () => {
  it("strips spaces, dashes, parentheses and dots", () => {
    assert.equal(normalizePhone("+7 (777) 123-45-67"), "+77771234567");
    assert.equal(normalizePhone("8 777 123.45.67"), "87771234567");
  });

  it("keeps a number that is already canonical", () => {
    assert.equal(normalizePhone("+77001234567"), "+77001234567");
  });

  it("returns an empty value unchanged", () => {
    assert.equal(normalizePhone(""), "");
  });
});
