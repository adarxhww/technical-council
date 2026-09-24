"use client";

import { usePathname } from "next/navigation";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/login";

  // Admin pages and admin login should have no public header/footer.
  if (isAdminRoute || isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <div className="page-shell">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}