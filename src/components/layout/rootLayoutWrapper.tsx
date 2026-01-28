"use client";

import { usePathname } from "next/navigation";
import MainLayout from "./mainLayout";

export const RootLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  
  // Skip MainLayout untuk halaman auth (login/register)
  const isAuthPage = pathname === "/login" || pathname === "/register";
  
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  return <MainLayout>{children}</MainLayout>;
};
