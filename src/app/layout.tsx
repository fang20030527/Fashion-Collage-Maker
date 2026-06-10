import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fashion Collage Maker",
  description: "Create an editorial outfit collage from 4 photos."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
