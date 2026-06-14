import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@/features/fashion-collage-maker/constants";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`
  },
  description:
    "Create a magazine-ready fashion collage from 1 to 6 photos in your browser. Photos are not uploaded.",
  applicationName: APP_NAME,
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
