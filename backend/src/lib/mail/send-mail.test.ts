import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockEnv = vi.hoisted(
  (): {
    NODE_ENV: string;
    BREVO_API_KEY?: string;
    MAIL_FROM_EMAIL?: string;
    MAIL_FROM_NAME: string;
  } => ({ NODE_ENV: "test", MAIL_FROM_NAME: "Life Tracker" }),
);

vi.mock("../../config/env", () => ({ env: mockEnv }));

import { sendMail } from "./send-mail";

const message = {
  to: "user@example.com",
  subject: "Hello",
  text: "plain body",
  html: "<p>html body</p>",
};

beforeEach(() => {
  mockEnv.NODE_ENV = "test";
  mockEnv.BREVO_API_KEY = undefined;
  mockEnv.MAIL_FROM_EMAIL = undefined;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("sendMail without an API key", () => {
  it("prints the email instead of sending it", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const log = vi.spyOn(console, "info").mockImplementation(() => {});

    await sendMail(message);

    expect(fetchMock).not.toHaveBeenCalled();
    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("user@example.com");
    expect(output).toContain("Hello");
    expect(output).toContain("plain body");
  });

  it("refuses to run in production", async () => {
    mockEnv.NODE_ENV = "production";

    await expect(sendMail(message)).rejects.toThrow("BREVO_API_KEY");
  });
});

describe("sendMail with an API key", () => {
  beforeEach(() => {
    mockEnv.BREVO_API_KEY = "secret-key";
    mockEnv.MAIL_FROM_EMAIL = "sender@example.com";
  });

  it("posts the email to Brevo", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    vi.stubGlobal("fetch", fetchMock);

    await sendMail(message);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["api-key"]).toBe(
      "secret-key",
    );
    expect(JSON.parse(init.body as string)).toEqual({
      sender: { name: "Life Tracker", email: "sender@example.com" },
      to: [{ email: "user@example.com" }],
      subject: "Hello",
      textContent: "plain body",
      htmlContent: "<p>html body</p>",
    });
  });

  it("throws when Brevo answers with an error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );

    await expect(sendMail(message)).rejects.toThrow("401");
  });

  it("does not put the API key in the error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    await expect(sendMail(message)).rejects.not.toThrow("secret-key");
  });
});
