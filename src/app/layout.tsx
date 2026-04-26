import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const rubik = localFont({
  src: "../../public/fonts/Rubik-VariableFont_wght.ttf",
  variable: "--font-rubik",
  display: "swap",
  weight: "300 900",
});

export const metadata: Metadata = {
  title: "Folk Devils — Business Card Builder",
  description:
    "Design print-ready Folk Devils business cards. Export SVG, PNG (300 DPI) and MOO-compatible PDF with bleed.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${rubik.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
