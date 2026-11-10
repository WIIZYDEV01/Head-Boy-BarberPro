import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { AppChrome } from "@/components/media/app-chrome";
import { JsonLd } from "@/components/seo/json-ld";
import { BRAND_NAME } from "@/lib/brand";
import { DEFAULT_DESCRIPTION, organizationJsonLd, SEO_KEYWORDS, SITE_URL } from "@/lib/seo";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} | Book a barbing salon · BarberPro · BerbingPro`,
    template: `%s · ${BRAND_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  applicationName: BRAND_NAME,
  authors: [{ name: BRAND_NAME, url: SITE_URL }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  category: "business",
  alternates: { canonical: SITE_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: BRAND_NAME,
    locale: "en_NG",
    title: `${BRAND_NAME} — barbing salon booking and shop software`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=70",
        width: 1200,
        height: 630,
        alt: "Head Boy BarberPro barbing salon floor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} | BarberPro · BerbingPro`,
    description: DEFAULT_DESCRIPTION,
  },
  verification: {
    google: "KzVTj8W8Lu_RJxYpS6qPwJcnqYzjrvx2a7cfrGB4fZI",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable} h-full antialiased`}>
      <head>
        {supabaseUrl ? <link rel="preconnect" href={supabaseUrl} /> : null}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://videos.pexels.com" />
        <link rel="dns-prefetch" href="https://assets.mixkit.co" />
      </head>
      <body className="relative flex min-h-full flex-col bg-transparent text-foreground">
        <JsonLd data={organizationJsonLd()} />
        <AppChrome>{children}</AppChrome>
        <Toaster theme="dark" richColors position="top-right" />
      </body>
    </html>
  );
}
