import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
  display: "swap",
});

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KDCharite — Turning Everyday Transactions Into Life-Changing Impact",
  description:
    "KDCharite is East Africa's leading transparent digital charity ecosystem. We turn everyday fuel purchases and church giving into life-changing impact for orphans, communities, and futures.",
  keywords: [
    "KDCharite",
    "charity",
    "NGO",
    "Africa",
    "donations",
    "fuel station charity",
    "church giving",
    "impact",
    "Tanzania",
  ],
  openGraph: {
    title: "KDCharite — Small Contributions. Massive Impact.",
    description:
      "East Africa's premier transparent digital charity. Every litre. Every prayer. Every coin matters.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "KDCharite — Turning Everyday Transactions Into Life-Changing Impact",
    description:
      "East Africa's premier transparent digital charity. Every litre. Every prayer. Every coin matters.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakartaSans.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased bg-navy text-warm-white overflow-x-hidden">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
