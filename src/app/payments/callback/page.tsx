import Link from "next/link";
import { connection } from "next/server";
import { applyVerifiedPayment } from "@/app/actions/payments";
import { Button } from "@/components/ui/button";

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const reference = params.reference || params.trxref;

  if (!reference) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <h1 className="font-serif text-3xl">Payment reference missing</h1>
        <p className="mt-3 text-sm text-muted">Return from Paystack did not include a transaction reference.</p>
      </div>
    );
  }

  let message = "We could not verify this payment yet.";
  let ok = false;
  try {
    const result = await applyVerifiedPayment(reference);
    ok = result.status === "success" || result.alreadyProcessed;
    message = ok
      ? "Payment verified. Your appointment is confirmed."
      : `Paystack reported status: ${result.status}. The booking stays pending until a successful verification.`;
  } catch (error) {
    message = error instanceof Error ? error.message : message;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <h1 className="font-serif text-3xl">{ok ? "Payment confirmed" : "Payment not complete"}</h1>
      <p className="mt-3 text-sm text-muted">{message}</p>
      <p className="mt-2 text-xs text-muted">
        Browser return is not trusted by itself. This page and the webhook both verify the transaction with Paystack.
      </p>
      <Button asChild className="mt-6">
        <Link href="/app/bookings">View my bookings</Link>
      </Button>
    </div>
  );
}
