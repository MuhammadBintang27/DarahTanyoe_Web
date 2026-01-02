"use client";

import { useAuth } from "@/context/authContext";
import { useSidebar } from "@/context/sidebarContext";
import { ChevronDown, Hospital, LogOut, Menu, Building2 } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import NotificationBell from "@/components/NotificationBell";

export const Header = () => {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const institutionId = user?.institution_id || user?.id;
  const institutionType = user?.institution_type;
  const institutionName = user?.institution_name;

  // Determine icon and label based on institution type
  const InstitutionIcon = institutionType === 'pmi' ? Building2 : Hospital;
  const institutionLabel = institutionType === 'pmi' ? 'PMI' : 'Rumah Sakit';

  if (pathname === "/login") {
    return null;
  }

  return (
    
    <div className="bg-white w-screen h-14 flex items-center justify-between gap-4 px-8 fixed left-0 top-0 shadow-md z-40">
      <button onClick={toggleSidebar} className="cursor-pointer hover:scale-105 duration-200">
        <Menu color="#151515" />
      </button>
      <div className="flex items-center gap-8">
        {institutionId && <NotificationBell institutionId={institutionId} />}
        <div className="flex gap-2 items-center">
          <InstitutionIcon className="text-[#AB4545]" />
          <div className="flex flex-col">
            <p className="font-bold text-sm text-black_primary leading-tight">
              {user && user.full_name}
            </p>
            <p className="text-xs text-gray-500 leading-tight">
              {institutionName}
            </p>
          </div>
        </div>
        <button className="flex items-center ml-10 gap-2 bg-primary rounded-full px-4 py-1.5 shadow-md hover:bg-primary/90 transition-colors">
          <p className="font-light text-sm text-white">{institutionLabel}</p>
          <ChevronDown color="white" width={20} />
        </button>
        <button onClick={logout} className="flex items-center ml-10 gap-2 bg-primary rounded-full px-4 py-1.5 shadow-md hover:bg-primary/90 transition-colors">
          <p className="font-light text-sm text-white">Logout</p>
          <LogOut color="white" width={20} />
        </button>
      </div>
    </div>
  );
};
