import { describe, expect, it } from "vitest";
import { createSessionToken, hashPassword, readSessionToken, SESSION_TTL_SECONDS, verifyPassword } from "./session.ts";

describe("session tokens", () => {
  it("round-trips a user id", () => {
    expect(readSessionToken(createSessionToken("user-1"))).toBe("user-1");
  });

  it("rejects tampered, malformed and missing tokens", () => {
    const [data, sig] = createSessionToken("user-1").split(".");
    const forged = Buffer.from(JSON.stringify({ uid: "admin", exp: Date.now() + 1e9 })).toString("base64url");
    expect(readSessionToken(`${forged}.${sig}`)).toBeNull();
    expect(readSessionToken(`${data}.${sig.slice(1)}`)).toBeNull();
    expect(readSessionToken("not-a-token")).toBeNull();
    expect(readSessionToken(undefined)).toBeNull();
  });

  it("expires after the session lifetime", () => {
    const token = createSessionToken("user-1", 0);
    expect(readSessionToken(token, SESSION_TTL_SECONDS * 1000 - 1)).toBe("user-1");
    expect(readSessionToken(token, SESSION_TTL_SECONDS * 1000 + 1)).toBeNull();
  });
});

describe("passwords", () => {
  it("verifies the right password only", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).not.toContain("correct");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong horse battery", hash)).toBe(false);
  });

  it("salts each hash", async () => {
    expect(await hashPassword("same password here")).not.toBe(await hashPassword("same password here"));
  });
});
