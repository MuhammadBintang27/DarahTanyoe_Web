"use client";

import { usePathname } from "next/navigation";
import MainLayout from "./mainLayout";

export const RootLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  
  // Skip MainLayout untuk halaman auth (login/register) dan redirect pages (app/*)
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isPublicAppPage = pathname?.startsWith("/app/"); // Redirect pages, no auth needed
  
  if (isAuthPage || isPublicAppPage) {
    return <>{children}</>;
  }
  
  return <MainLayout>{children}</MainLayout>;
};
