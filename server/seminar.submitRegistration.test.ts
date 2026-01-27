import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as seminar from "./seminar";
import * as sendgrid from "./sendgrid";

// Mock the dependencies
vi.mock("./seminar");
vi.mock("./sendgrid");

function createTestContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("seminar.submitRegistration", () => {
  it("should successfully register a seminar participant", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Mock successful database insertion
    vi.mocked(seminar.createSeminarRegistration).mockResolvedValue({
      insertId: 1,
      affectedRows: 1,
    } as any);

    // Mock successful email sending
    vi.mocked(sendgrid.sendEmail).mockResolvedValue(true);

    const input = {
      company: "テスト機械株式会社",
      name: "山田太郎",
      position: "営業部長",
      email: "test@example.com",
      phone: "090-1234-5678",
      challenge: "見積作成に時間がかかる",
    };

    const result = await caller.seminar.submitRegistration(input);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Registration completed");

    // Verify database was called with correct data
    expect(seminar.createSeminarRegistration).toHaveBeenCalledWith({
      companyName: input.company,
      name: input.name,
      position: input.position,
      email: input.email,
      phone: input.phone,
      challenge: input.challenge,
    });

    // Verify emails were sent (admin + user)
    expect(sendgrid.sendEmail).toHaveBeenCalledTimes(2);
  });

  it("should handle registration without optional challenge field", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    vi.mocked(seminar.createSeminarRegistration).mockResolvedValue({
      insertId: 1,
      affectedRows: 1,
    } as any);

    vi.mocked(sendgrid.sendEmail).mockResolvedValue(true);

    const input = {
      company: "テスト機械株式会社",
      name: "山田太郎",
      position: "営業部長",
      email: "test@example.com",
      phone: "090-1234-5678",
    };

    const result = await caller.seminar.submitRegistration(input);

    expect(result.success).toBe(true);

    // Verify challenge was set to null
    expect(seminar.createSeminarRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        challenge: null,
      })
    );
  });

  it("should return failure on database error", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Mock database error
    vi.mocked(seminar.createSeminarRegistration).mockRejectedValue(
      new Error("Database error")
    );

    const input = {
      company: "テスト機械株式会社",
      name: "山田太郎",
      position: "営業部長",
      email: "test@example.com",
      phone: "090-1234-5678",
    };

    const result = await caller.seminar.submitRegistration(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Registration failed");
  });
});
