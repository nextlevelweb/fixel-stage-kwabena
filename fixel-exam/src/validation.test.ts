import { describe, it, expect } from "vitest";
import { checkName, checkUrl, checkText, makePublicKey } from "./validation";

describe("checkName", function () {
  it("refuses an empty name", function () {
    expect(checkName("   ")).toBe("Geef het project een naam");
  });

  it("refuses a name longer than 80 characters", function () {
    expect(checkName("a".repeat(81))).not.toBe("");
  });

  it("accepts a normal name", function () {
    expect(checkName("Website van Sam")).toBe("");
  });
});

describe("checkUrl", function () {
  it("accepts http and https", function () {
    expect(checkUrl("https://website.nl")).toBe("");
    expect(checkUrl("http://website.nl/contact")).toBe("");
  });

  it("refuses text that is not a URL", function () {
    expect(checkUrl("website")).not.toBe("");
    expect(checkUrl("")).not.toBe("");
  });

  it("refuses other protocols", function () {
    expect(checkUrl("ftp://website.nl")).not.toBe("");
    expect(checkUrl("javascript:alert(1)")).not.toBe("");
  });
});

describe("checkText", function () {
  it("refuses empty text with the given message", function () {
    expect(checkText("  ", "Beschrijf wat je bedoelt")).toBe("Beschrijf wat je bedoelt");
  });

  it("refuses text longer than 500 characters", function () {
    expect(checkText("a".repeat(501), "leeg")).not.toBe("");
  });

  it("accepts 500 characters", function () {
    expect(checkText("a".repeat(500), "leeg")).toBe("");
  });
});

describe("makePublicKey", function () {
  it("has at least 32 characters", function () {
    expect(makePublicKey().length).toBeGreaterThanOrEqual(32);
  });

  it("is different every time", function () {
    expect(makePublicKey()).not.toBe(makePublicKey());
  });
});
