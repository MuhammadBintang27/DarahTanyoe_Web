"use client";

import { LayoutDashboard, NotebookPen, Plus, Info, TruckIcon, History, Users } from "lucide-react";
import Image from "next/image";
import React from "react";
import StokDarahIcon from "../icons/stokDarah";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/sidebarContext";
import { useAuth } from "@/context/authContext";

export const Sidebar = () => {
  const pathname = usePathname();
  const { isShowSidebar } = useSidebar();
  const { user } = useAuth();

  // Menu untuk PMI
  const pmiMenu = [
    {
      name: "Dashboard",
      icon: () => <LayoutDashboard color="#9AA2AC" />,
      url: "/pmi",
    },
    {
      name: "Permintaan",
      icon: () => <NotebookPen color="#9AA2AC" />,
      url: "/permintaan",
    },
    {
      name: "Pemenuhan Darah",
      icon: () => <Users color="#9AA2AC" />,
      url: "/pemenuhan",
    },
    {
      name: "Stok Darah",
      icon: () => <StokDarahIcon width={22} height={22} fill="#9AA2AC" />,
      url: "/stok-darah",
    },
    {
      name: "Pick Up",
      icon: () => <TruckIcon color="#9AA2AC" />,
      url: "/pickup",
    },
    {
      name: "Riwayat Stok",
      icon: () => <History color="#9AA2AC" />,
      url: "/riwayat-stok",
    },
  ];

  // Menu untuk Rumah Sakit
  const hospitalMenu = [
    {
      name: "Dashboard",
      icon: () => <LayoutDashboard color="#9AA2AC" />,
      url: "/hospital",
    },
    {
      name: "Permintaan",
      icon: () => <NotebookPen color="#9AA2AC" />,
      url: "/permintaan",
    },
    {
      name: "Informasi PMI",
      icon: () => <Info color="#9AA2AC" />,
      url: "/informasi-pmi",
    },
    {
      name: "Pick Up",
      icon: () => <TruckIcon color="#9AA2AC" />,
      url: "/pickup",
    },
  ];

  // Pilih menu berdasarkan tipe institusi
  const menu = user?.institution_type === "hospital" ? hospitalMenu : pmiMenu;

  if (pathname === "/login") {
    return null;
  }
  
  return (
    <div className="fixed left-0 h-full">
      <div
        className={`bg-white h-full w-1/5 shadow-lg fixed left-0 transition-transform duration-300 pt-6 px-4 flex flex-col gap-8 top-14 ${
          isShowSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="w-full justify-center flex">
          <Image src="/images/logo.png" alt="logo" width={200} height={200} />
        </div>
        <button className="bg-primary cursor-pointer flex gap-2 items-center justify-center rounded-2xl shadow-black/40 shadow-md w-full py-3 hover:scale-105 duration-200">
          <p className="font-bold text-white">Tambah Event</p>
          <Plus color="white" />
        </button>
        <div className="flex flex-col gap-8">
          {menu
            .filter((item) => item.url)
            .map((item, index) => (
              <Link
                href={item.url!}
                key={index}
                className={`${
                  pathname === item.url ? "bg-primary/20 rounded-2xl " : ""
                } hover:scale-105 duration-200 px-4 flex gap-4 items-center w-full py-3`}
              >
                {typeof item.icon === "function" ? item.icon() : item.icon}
                <p className="text-black_primary/80 font-bold text-xl">
                  {item.name}
                </p>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};
