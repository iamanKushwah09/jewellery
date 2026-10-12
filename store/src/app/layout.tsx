import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RouteLoader from "../components/RouteLoader";
import MetaPixel from "../components/MetaPixel";
import { Suspense } from "react";
import WhatsAppButton from "../components/WhatsAppButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bioinnovate Pharma - Premium Healthcare",
  description: "Discover the latest healthcare and wellness products from Bioinnovate Pharma of Companies. Quality, care, and health in every product.",
  keywords: "bioinnovate pharma, healthcare, pharmacy, wellness, ecommerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col overflow-x-hidden w-full`}
      >
        <Providers>
          <Suspense fallback={null}>
            <MetaPixel />
            <RouteLoader />
          </Suspense>
          <Header />
          <main className="flex-1 pt-[88px] md:pt-[120px] min-w-0 w-full overflow-x-hidden flex flex-col">
            {children}
          </main>
          <Footer />
          <WhatsAppButton />
        </Providers>
        {/* Meta Pixel noscript fallback for non-JS environments */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID || ''}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}
