import type { Metadata } from "next";
import { Newsreader, Red_Hat_Text } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const redHat = Red_Hat_Text({
  subsets: ["latin"],
  variable: "--font-red-hat",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "La Volta — Business Card Builder",
  description:
    "Design print-ready La Volta business cards. Export SVG, PNG (300 DPI) and MOO-compatible PDF with bleed.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${redHat.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
