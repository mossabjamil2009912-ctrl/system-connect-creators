import { describe, expect, it } from "vitest";
import { missingMedia, overLimit } from "@/lib/platforms";

describe("platform rules", () => {
  it("flags twitter when text exceeds 280 chars", () => {
    expect(overLimit("a".repeat(281), ["twitter", "facebook"])).toEqual(["twitter"]);
  });
  it("instagram and tiktok require media", () => {
    expect(missingMedia(false, ["instagram", "tiktok", "telegram"])).toEqual(["instagram", "tiktok"]);
  });
});
