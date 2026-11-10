import { BRAND_NAME, BRAND_SHORT, BRAND_TAGLINE } from "@/lib/brand";
import { getAppUrl } from "@/lib/env";

export const SITE_URL = "https://head-boy-barberpro-web.vercel.app";

export const SEO_KEYWORDS = [
  "Head Boy BarberPro",
  "BarberPro",
  "berbingpro",
  "barbingpro",
  "barbing salon booking",
  "barber shop booking app",
  "online barbing appointment",
  "Paystack barber payments",
  "Nigeria barbing salon software",
  "book a barber",
  "salon management software",
];

export const DEFAULT_DESCRIPTION =
  "Head Boy BarberPro (BarberPro / BerbingPro) is premium barbing salon software: book a chair online, manage staff and hours, and take Paystack payments. Built for real shops, not dummy data.";

export function absoluteUrl(path = "/") {
  const base = (getAppUrl() || SITE_URL).replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMeta({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}) {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    keywords: SEO_KEYWORDS,
    alternates: { canonical: url },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "website" as const,
      url,
      siteName: BRAND_NAME,
      title: `${title} · ${BRAND_NAME}`,
      description,
      locale: "en_NG",
      images: [
        {
          url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=70",
          width: 1200,
          height: 630,
          alt: "Classic barbing salon chairs and mirrors at Head Boy BarberPro",
        },
      ],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${title} · ${BRAND_SHORT}`,
      description,
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND_NAME,
    alternateName: ["BarberPro", "BerbingPro", "BarbingPro", BRAND_SHORT],
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    slogan: BRAND_TAGLINE,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "NGN",
    },
    featureList: [
      "Online barbing salon booking",
      "Staff and chair calendars",
      "Paystack deposits and full payment",
      "Customer profiles and visit history",
    ],
    publisher: {
      "@type": "Organization",
      name: BRAND_NAME,
      url: SITE_URL,
    },
  };
}

export const HOME_FAQS = [
  {
    q: "What is Head Boy BarberPro, BarberPro, or BerbingPro?",
    a: "Head Boy BarberPro is a live barbing salon booking and shop-management product. People also search BarberPro, BarbingPro, and BerbingPro — they all point to this same Head Boy platform for booking chairs and running a salon.",
  },
  {
    q: "How do I book a barbing salon online?",
    a: "Open the salon directory, pick a published shop, choose a service and barber, then confirm a live time slot. If the salon requires Paystack, checkout opens after the appointment is saved.",
  },
  {
    q: "Can salon owners take payments?",
    a: "Yes. Owners set full payment, a deposit, or pay-at-salon. Card charges go through Paystack. The dashboard only counts verified successful payments.",
  },
  {
    q: "Is Head Boy BarberPro for Nigeria barbing shops?",
    a: "Yes. It is built for barbing salons that work in Naira and similar currencies, with Africa/Lagos hours, staff chairs, and real appointments — not dummy calendars.",
  },
];
