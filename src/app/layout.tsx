import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Infinits",
  description: "Experiments in new ways of inputting music notation",
};

export default function RootLayout({
  children: mainCanvas,
  keyboard,
  previewCanvas,
}: {
  children: React.ReactNode;
  keyboard: React.ReactNode;
  previewCanvas: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {mainCanvas}
        {keyboard}
        {previewCanvas}
      </body>
    </html>
  );
}
