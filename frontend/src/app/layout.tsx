import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TRACEBACK | Evidence-Linked Security Log Investigation",
  description:
    "50,000 log lines. One attacker. Every claim proven. TRACEBACK transforms raw security logs into evidence-locked incident narratives.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ background: "#080c14" }}>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-cyber-grid antialiased`}
        style={{ background: "#080c14", color: "#e2e8f0", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
      >
        <Navbar />
        <main className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
