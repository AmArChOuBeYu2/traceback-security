import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";

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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-slate-100 bg-cyber-grid antialiased">
        <Navbar />
        <main className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
