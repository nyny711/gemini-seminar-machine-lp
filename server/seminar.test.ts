import { describe, expect, it, vi } from "vitest";
import { createSeminarRegistration, getAllSeminarRegistrations } from "./seminar";
import * as db from "./db";

// Mock the database module
vi.mock("./db");

describe("seminar database operations", () => {
  describe("createSeminarRegistration", () => {
    it("should insert seminar registration into database", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue({
            insertId: 1,
            affectedRows: 1,
          }),
        }),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const registrationData = {
        companyName: "テスト機械株式会社",
        name: "山田太郎",
        position: "営業部長",
        email: "test@example.com",
        phone: "090-1234-5678",
        challenge: "見積作成に時間がかかる",
      };

      const result = await createSeminarRegistration(registrationData);

      expect(result).toBeDefined();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should throw error when database is not available", async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      const registrationData = {
        companyName: "テスト機械株式会社",
        name: "山田太郎",
        position: "営業部長",
        email: "test@example.com",
        phone: "090-1234-5678",
        challenge: null,
      };

      await expect(createSeminarRegistration(registrationData)).rejects.toThrow(
        "Database not available"
      );
    });
  });

  describe("getAllSeminarRegistrations", () => {
    it("should return all seminar registrations", async () => {
      const mockRegistrations = [
        {
          id: 1,
          companyName: "テスト機械株式会社",
          name: "山田太郎",
          position: "営業部長",
          email: "test@example.com",
          phone: "090-1234-5678",
          challenge: "見積作成に時間がかかる",
          createdAt: new Date(),
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockResolvedValue(mockRegistrations),
        }),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await getAllSeminarRegistrations();

      expect(result).toEqual(mockRegistrations);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should return empty array when database is not available", async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      const result = await getAllSeminarRegistrations();

      expect(result).toEqual([]);
    });
  });
});
