import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LockFrame Studio — Controllable 2D/3D Visual Co-Pilot",
  description: "Artists decide what changes. AI performs the edit. LockFrame verifies what stayed untouched.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
