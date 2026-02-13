"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import ProtectedRoute from "@/components/protectedRoute/protectedRoute";

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

  return (
    <ProtectedRoute>
      <div className="w-full h-full flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          <p className="text-primary text-lg mt-4 font-medium">Memuat Dashboard...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Home;
