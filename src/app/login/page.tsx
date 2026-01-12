// app/login/page.tsx
"use client";

import React, { useEffect, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/authContext";
import Image from "next/image";

const LoginContent = () => {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email');

  const [email, setEmail] = React.useState(emailFromQuery || "");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const router = useRouter();
  const { login, checkAuthStatus } = useAuth();

  // Check if already logged in
  useEffect(() => {
    const isLoggedIn = checkAuthStatus();
    console.log('[LoginPage] Initial auth check:', isLoggedIn);

    if (isLoggedIn) {
      console.log('[LoginPage] Already logged in, redirecting to dashboard');
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

      if (response.data.success) {
        const { token, institution } = response.data.data;
        login(token, institution);
        console.log('[LoginPage] Login successful, redirecting to dashboard');
        router.replace("/");
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err: any) {
      console.error('[LoginPage] Login error:', err);
      setError(err.response?.data?.message || "An error occurred during login");
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
        <p className="text-sm text-primary/60 mb-4">
          *Pendonor silakan gunakan aplikasi mobile
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
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="shadow-lg h-14 border border-black/20 placeholder:text-black/20 bg-white/ backdrop-blur rounded-xl px-4 focus:outline-none text-black/70"
            />
          </div>
          <button
            type="submit"
            className="cursor-pointer bg-primary text-white mt-8 shadow-lg px-12 py-4 rounded-xl font-bold text-xl hover:bg-primary/80"
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
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;