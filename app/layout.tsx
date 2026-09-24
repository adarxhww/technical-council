import "./globals.css";

import type { Metadata } from "next";

import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Technical Council | REC Ambedkar Nagar",
  description: "Official Hub for Innovation and Technical Excellence",
  openGraph: {
    title: "Technical Council | REC Ambedkar Nagar",
    description: "Official Hub for Innovation and Technical Excellence",
    url: "https://technical-council-portal.vercel.app",
    siteName: "Technical Council RECABN",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}