"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import ProtectedRoute from "@/components/protectedRoute/protectedRoute";

const Home = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Route ke dashboard yang sesuai dengan role
      if (user.institution_type === 'hospital') {
        router.replace('/hospital');
      } else if (user.institution_type === 'pmi') {
        router.replace('/pmi');
      } else if (user.user_type === 'donor') {
        router.replace('/donor');
      }
    }
  }, [user, loading, router]);

  return (
    <ProtectedRoute>
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-bold text-3xl text-white mb-4">Loading Dashboard...</h2>
          <div className="flex gap-2 justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Home;
