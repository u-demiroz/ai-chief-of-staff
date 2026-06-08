import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Chief of Staff",
  description: "Özel dijital COO - Proje takibi, AI kararları ve takvim",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className={`${inter.className} antialiased bg-zinc-950 text-zinc-50 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
