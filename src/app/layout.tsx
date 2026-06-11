import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Fashion Collage Maker",
    template: "%s | Fashion Collage Maker"
  },
  description:
    "Create an editorial outfit collage from 4 photos in your browser. Photos are not uploaded.",
  applicationName: "Fashion Collage Maker",
  keywords: [
    "fashion collage maker",
    "outfit collage",
    "photo collage",
    "browser photo editor"
  ]
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
