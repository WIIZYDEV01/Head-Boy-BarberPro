import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getPaystackWebhookSecret, requirePaystackSecret } from "@/lib/env";

export type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string | null;
    id: number;
    metadata?: Record<string, unknown>;
  };
};

export function createPaymentReference() {
  return `bpr_${randomBytes(16).toString("hex")}`;
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const secret = getPaystackWebhookSecret();
  if (!secret || !signature) return false;
  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
  const left = Buffer.from(hash);
  const right = Buffer.from(signature);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountKobo: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  const secret = requirePaystackSecret();
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
  const json = (await res.json()) as PaystackInitializeResponse;
  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message || "Paystack initialization failed");
  }
  return json.data;
}

export async function verifyPaystackTransaction(reference: string) {
  const secret = requirePaystackSecret();
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    },
  );
  const json = (await res.json()) as PaystackVerifyResponse;
  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message || "Paystack verification failed");
  }
  return json.data;
}

export function mapPaystackStatus(status: string): "success" | "failed" | "abandoned" | "pending" {
  if (status === "success") return "success";
  if (status === "failed") return "failed";
  if (status === "abandoned") return "abandoned";
  return "pending";
}
