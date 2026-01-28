import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import AuthProvider from "@/app/providers/authProvider";
import ReactQueryProvider from "./providers/ReactQueryProvider";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.chhabragifts.in"),

  title: {
    default: "Chhabra Gifts – Personalized Gifts & Hampers",
    template: "%s | Chhabra Gifts",
  },

  description:
    "Buy personalized gifts, hampers, and custom gift items from Chhabra Gifts. Fast delivery across India.",

 
  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Chhabra Gifts – Personalized Gifts & Hampers",
    description:
      "Personalized gifts, hampers, and custom gift items with fast delivery across India.",
    url: "https://www.chhabragifts.com",
    siteName: "Chhabra Gifts",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Chhabra Gifts",
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Chhabra Gifts – Personalized Gifts & Hampers",
    description:
      "Personalized gifts, hampers, and custom gift items with fast delivery across India.",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReactQueryProvider>
          <AuthProvider>
            <header>
              <Navbar />
            </header>

            <main>{children}</main>

            <footer>{/* Add footer later */}</footer>

            <Toaster position="top-center" />
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
