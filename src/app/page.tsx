"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";

const Home = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Route ke dashboard yang sesuai dengan role
        if (user.institution_type === 'hospital') {
          router.replace('/hospital');
        } else if (user.institution_type === 'pmi') {
          router.replace('/pmi');
        } else if (user.user_type === 'donor') {
          router.replace('/donor');
        }
      } else {
        // No user data, redirect to login
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Return null untuk tidak menampilkan apapun saat redirect
  return null;
};

export default Home;
