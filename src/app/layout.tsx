import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { AppChrome } from "@/components/media/app-chrome";
import { BRAND_NAME } from "@/lib/brand";
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
  title: {
    default: BRAND_NAME,
    template: `%s · ${BRAND_NAME}`,
  },
  description: "Premium multi-salon booking and management for barbing salons.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable} h-full antialiased`}>
      <head>
        {supabaseUrl ? <link rel="preconnect" href={supabaseUrl} /> : null}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://videos.pexels.com" />
      </head>
      <body className="relative flex min-h-full flex-col bg-transparent text-foreground">
        <AppChrome>{children}</AppChrome>
        <Toaster theme="dark" richColors position="top-right" />
      </body>
    </html>
  );
}
