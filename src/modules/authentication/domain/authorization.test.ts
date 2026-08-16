import { describe, expect, it } from "vitest";
import { can, seasonCapabilities, type SeasonStatus } from "./authorization";

describe("season authorization policy", () => {
  it("denies every capability without a season membership", () => {
    for (const capability of seasonCapabilities) {
      expect(can({ role: null, status: "ACTIVE" }, capability)).toBe(false);
    }
  });

  it("lets a manager read but never mutate MVP data", () => {
    for (const capability of seasonCapabilities) {
      expect(can({ role: "MANAGER", status: "ACTIVE" }, capability)).toBe(
        capability === "season:view",
      );
    }
  });

  it.each<SeasonStatus>(["DRAFT", "ACTIVE"])(
    "lets an employee manage an editable %s season",
    (status) => {
      expect(can({ role: "EMPLOYEE", status }, "season:view")).toBe(true);
      expect(can({ role: "EMPLOYEE", status }, "season:edit-setup")).toBe(true);
      expect(can({ role: "EMPLOYEE", status }, "season:manage-projects")).toBe(true);
      expect(can({ role: "EMPLOYEE", status }, "season:manage-sprints")).toBe(true);
      expect(can({ role: "EMPLOYEE", status }, "season:manage-tasks")).toBe(true);
      expect(can({ role: "EMPLOYEE", status }, "season:manage-settings")).toBe(true);
      expect(can({ role: "EMPLOYEE", status }, "season:close")).toBe(true);
      expect(can({ role: "EMPLOYEE", status }, "season:reopen")).toBe(false);
    },
  );

  it("makes a closed season read-only except for an employee reopen", () => {
    expect(can({ role: "EMPLOYEE", status: "CLOSED" }, "season:view")).toBe(true);
    expect(can({ role: "EMPLOYEE", status: "CLOSED" }, "season:manage-tasks")).toBe(false);
    expect(can({ role: "EMPLOYEE", status: "CLOSED" }, "season:close")).toBe(false);
    expect(can({ role: "EMPLOYEE", status: "CLOSED" }, "season:reopen")).toBe(true);
  });

  it("keeps future manager approval disabled for both roles", () => {
    expect(can({ role: "EMPLOYEE", status: "ACTIVE" }, "season:manager-review")).toBe(false);
    expect(can({ role: "MANAGER", status: "ACTIVE" }, "season:manager-review")).toBe(false);
  });
});
