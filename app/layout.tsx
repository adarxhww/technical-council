import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Technical Council | REC Ambedkar Nagar",
  description: "Official Hub for Innovation and Technical Excellence",
  openGraph: {
    title: "Technical Council | REC Ambedkar Nagar",
    description: "Official Hub for Innovation and Technical Excellence",
    url: "https://technical-council-portal.vercel.app",
    siteName: "Technical Council RECABN",
    locale: "en_US",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="page-shell">
          <Navbar />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}