import { describe, expect, it } from "vitest";
import { canEditPlace, canManage, canPublish } from "./permissions.ts";

describe("roles", () => {
  it("only admins publish and manage", () => {
    expect(canPublish("admin")).toBe(true);
    expect(canPublish("editor")).toBe(false);
    expect(canManage("editor")).toBe(false);
  });

  it("editors can't change a live place", () => {
    expect(canEditPlace("editor", "draft")).toBe(true);
    expect(canEditPlace("editor", "review")).toBe(true);
    expect(canEditPlace("editor", "published")).toBe(false);
    expect(canEditPlace("admin", "published")).toBe(true);
  });
});
