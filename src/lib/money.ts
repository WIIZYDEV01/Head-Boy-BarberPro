export type CurrencyCode = "NGN" | "GHS" | "USD" | "ZAR" | "KES";

const ZERO_DECIMAL = new Set(["NGN", "GHS", "ZAR", "KES", "USD"]);

export function minorUnitsLabel(currency: string) {
  return currency === "NGN" ? "kobo" : "minor units";
}

export function toMinorUnits(major: number): number {
  if (!Number.isFinite(major)) {
    throw new Error("Amount must be a finite number");
  }
  return Math.round(major * 100);
}

export function fromMinorUnits(minor: number): number {
  return minor / 100;
}

export function formatMoney(minor: number, currency: string) {
  const value = fromMinorUnits(minor);
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function depositAmountKobo(priceKobo: number, depositPercent: number) {
  if (priceKobo < 0 || depositPercent < 0 || depositPercent > 100) {
    throw new Error("Invalid price or deposit percent");
  }
  return Math.round((priceKobo * depositPercent) / 100);
}

export function requiredChargeKobo(input: {
  priceKobo: number;
  policy: "full" | "deposit" | "at_salon";
  depositPercent: number;
}) {
  if (input.policy === "at_salon") return 0;
  if (input.policy === "full") return input.priceKobo;
  return depositAmountKobo(input.priceKobo, input.depositPercent);
}

export function isSupportedPaystackCurrency(currency: string) {
  return ZERO_DECIMAL.has(currency);
}
