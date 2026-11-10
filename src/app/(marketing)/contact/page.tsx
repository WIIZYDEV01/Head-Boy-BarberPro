import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Contact",
  description:
    "Contact Head Boy BarberPro (BarberPro / BerbingPro) for product support. Published salon phone and email sit on each shop page.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-4xl">Contact Head Boy BarberPro</h1>
      <p className="mt-4 text-muted">
        Head Boy BarberPro — also searched as BarberPro and BerbingPro — is barbing salon software. For product support,
        use the email on your deployment. Individual shop phone numbers and emails appear on each published salon page
        when the owner has added them.
      </p>
      <ul className="mt-8 space-y-3 text-sm text-muted">
        <li>Book a chair: open the salon directory, pick a shop, then choose a live slot.</li>
        <li>Run a shop: sign in, create a salon, publish services and hours.</li>
        <li>Payments: Paystack handles cards. This app never stores card numbers.</li>
      </ul>
    </div>
  );
}
