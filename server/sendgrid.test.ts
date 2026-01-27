import { describe, expect, it, vi, beforeEach } from "vitest";
import { sendEmail } from "./sendgrid";

// Mock @sendgrid/mail
vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn(),
  },
}));

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variable
    delete process.env.SENDGRID_API_KEY;
  });

  it("should return false when SENDGRID_API_KEY is not set", async () => {
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test Subject",
      text: "Test content",
    });

    expect(result).toBe(false);
  });

  it("should successfully send email when API key is set", async () => {
    // Set API key
    process.env.SENDGRID_API_KEY = "test-api-key";
    process.env.SENDGRID_FROM_EMAIL = "noreply@anyenv-inc.com";

    const sgMail = await import("@sendgrid/mail");
    vi.mocked(sgMail.default.send).mockResolvedValue([
      { statusCode: 202, body: {}, headers: {} },
      {},
    ] as any);

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test Subject",
      text: "Test content",
      html: "<p>Test content</p>",
    });

    expect(result).toBe(true);
    expect(sgMail.default.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        subject: "Test Subject",
        text: "Test content",
        html: "<p>Test content</p>",
      })
    );
  });

  it("should return false on send error", async () => {
    process.env.SENDGRID_API_KEY = "test-api-key";

    const sgMail = await import("@sendgrid/mail");
    vi.mocked(sgMail.default.send).mockRejectedValue(new Error("Send failed"));

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test Subject",
      text: "Test content",
    });

    expect(result).toBe(false);
  });
});
