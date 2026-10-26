import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { verifyPaystackSignature } from "../src/lib/paystack";

describe("Paystack signature", () => {
  it("accepts a matching HMAC SHA512 signature and rejects a mismatch", () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "bpr_test" } });
    const good = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "sk_test_secret").update(body).digest("hex");
    process.env.PAYSTACK_SECRET_KEY = "sk_test_secret";
    expect(verifyPaystackSignature(body, createHmac("sha512", "sk_test_secret").update(body).digest("hex"))).toBe(true);
    expect(verifyPaystackSignature(body, "deadbeef")).toBe(false);
    expect(verifyPaystackSignature(body, null)).toBe(false);
    expect(good.length).toBeGreaterThan(10);
  });
});
