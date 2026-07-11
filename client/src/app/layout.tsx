import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Providers } from "./providers";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RouteLoader from "../components/RouteLoader";
import { Suspense } from "react";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Vellora Jewels — Crafting Moments, Forever",
  description: "Discover exquisite gold, diamond, and gemstone jewellery crafted with the finest artistry. Rings, necklaces, bridal sets, earrings and more — hallmarked and certified.",
  keywords: "Vellora Jewels, gold jewellery, diamond rings, bridal jewellery, necklace, earrings, bangles, BIS hallmark, indian jewellery",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body
        className={`${cormorant.variable} ${inter.variable} antialiased min-h-screen flex flex-col overflow-x-hidden w-full`}
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}
      >
        <Providers>
          <Suspense fallback={null}>
            <RouteLoader />
          </Suspense>
          <Header />
          <main className="flex-1 pt-[88px] md:pt-[120px] min-w-0 w-full overflow-x-hidden flex flex-col">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
