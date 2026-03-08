// app/login/page.tsx
"use client";

import React, { useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/authContext";
import Image from "next/image";
import toast from "react-hot-toast";

const LoginContent = () => {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email');

  const [email, setEmail] = React.useState(emailFromQuery || "");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const router = useRouter();
  const { login, checkAuthStatus } = useAuth();

  // Check if already logged in and redirect to specific dashboard
  useEffect(() => {
    const isLoggedIn = checkAuthStatus();
    if (isLoggedIn) {
      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          const targetPath = user.institution_type === 'hospital' ? '/hospital' 
                          : user.institution_type === 'pmi' ? '/pmi'
                          : user.user_type === 'donor' ? '/donor' 
                          : '/';
          console.log('[LoginPage] Already logged in, redirecting to:', targetPath);
          router.replace(targetPath);
          return;
        }
      } catch (e) {
        console.error('[LoginPage] Error parsing user data:', e);
      }
      // Fallback to home
      router.replace("/");
    }
  }, [checkAuthStatus, router]);

  // Set email from query param if exists
  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [emailFromQuery]);

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    console.log('[LoginPage] Attempting login for:', email);

    try {
      const response = await axios.post(`${baseUrl}/institutions/login`, {
        email,
        password,
      });

      console.log('[LoginPage] Login response:', response.data);

      if (response.data.status === 'SUCCESS') {
        const { session, institution } = response.data;
        login(institution, session);
        toast.success("Login berhasil!");
        
        // Direct redirect to specific dashboard based on role
        const targetPath = institution.institution_type === 'hospital' ? '/hospital' 
                        : institution.institution_type === 'pmi' ? '/pmi'
                        : institution.user_type === 'donor' ? '/donor' 
                        : '/';
        console.log('[LoginPage] Login successful, redirecting to:', targetPath);
        router.replace(targetPath);
      } else {
        const errorMessage = response.data.message || "Login gagal";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err: any) {
      console.error('[LoginPage] Login error:', err);
      const errorMessage = err.response?.data?.message || "Terjadi kesalahan saat login";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-screen h-screen flex items-center overflow-hidden bg-white">
      <Image
        src="/images/pattern.png"
        alt="pattern"
        fill
        className="object-cover opacity-5 -z-10"
      />
      <div className="w-1/2 h-full bg-white/20 relative">
        <Image
          src="/images/login-bg.png"
          alt="login-bg"
          fill
          className="object-contain"
        />
      </div>
      <div className="w-1/2 h-full flex flex-col items-center justify-center gap-4 bg-black/10 text-primary">
        <h2 className="font-bold text-5xl">Masuk</h2>
        <p className="font-light text-primary/50 mb-8">
          Selamat Datang di Darah Tanyoe - Portal Institusi
        </p>
        
        <form
          onSubmit={submitLogin}
          className="flex flex-col items-center gap-6 w-3/4"
        >
          <div className="flex flex-col gap-2 w-full">
            <label htmlFor="email" className="font-bold">
              Email
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(""); // Clear error when user types
              }}
              placeholder="Email"
              className="shadow-lg h-14 border border-black/20 placeholder:text-black/20 bg-white/ backdrop-blur rounded-xl px-4 focus:outline-none text-black/70"
            />
          </div>
          <div className="flex flex-col gap-2 w-full">
            <label htmlFor="password" className="font-bold">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(""); // Clear error when user types
              }}
              placeholder="Password"
              className="shadow-lg h-14 border border-black/20 placeholder:text-black/20 bg-white/ backdrop-blur rounded-xl px-4 focus:outline-none text-black/70"
            />
          </div>
          {/* Error message display */}
          {error && (
            <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer bg-primary text-white mt-8 shadow-lg px-12 py-4 rounded-xl font-bold text-xl hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Memproses..." : "Masuk"}
          </button>

          {/* Register Link */}
          <p className="text-center text-primary/70 mt-6">
            Belum punya akun?{" "}
            <a
              href="/register"
              className="text-primary font-bold hover:underline"
            >
              Daftar di sini
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <Suspense fallback={<div>Memuat...</div>}>
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
