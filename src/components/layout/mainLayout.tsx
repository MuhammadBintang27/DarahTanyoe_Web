"use client";

import { useSidebar } from "@/context/sidebarContext";
import { useAuth } from "@/context/authContext";
import { Header } from "@/components/header/header";
import { Sidebar } from "@/components/sidebar/sidebar";
import NotificationToast from "@/components/NotificationToast";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isShowSidebar } = useSidebar();
  const { user } = useAuth();
  
  const institutionId = user?.institution_id || user?.id;

  return (
    <div
      className={`antialiased bg-primary pt-20 transition-all duration-300 ${isShowSidebar ? "pl-[22vw]" : "pl-8"}`}
    >
      <Header />
      <Sidebar />
      
      {institutionId && <NotificationToast institutionId={institutionId} />}
      
      {children}
    </div>
  );
}

export default MainLayout;
