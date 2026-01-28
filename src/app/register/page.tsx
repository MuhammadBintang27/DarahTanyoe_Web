"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { INSTITUTION_TYPES } from "@/constants/user";
import { RegisterInstitutionData } from "@/types/user";
import toast from "react-hot-toast";
import Link from "next/link";
import { LocationPicker } from "@/components/location/LocationPicker";

const RegisterPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const [formData, setFormData] = useState<RegisterInstitutionData>({
    institution_type: "" as any,
    email: "",
    password: "",
    institution_name: "",
    address: "",
    phone_number: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleLocationSelect = (locationData: { latitude: number; longitude: number; address: string }) => {
    setLocation({ latitude: locationData.latitude, longitude: locationData.longitude });
    
    // Update address jika kosong atau update dari map
    if (!formData.address || formData.address.trim().length < 10) {
      setFormData((prev) => ({
        ...prev,
        address: locationData.address,
      }));
    }

    // Clear location error if exists
    if (errors.location) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.location;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.institution_type) {
      newErrors.institution_type = "Tipe institusi harus dipilih";
    }

    if (!formData.email) {
      newErrors.email = "Email harus diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
    }

    if (!formData.institution_name || formData.institution_name.trim().length < 3) {
      newErrors.institution_name = "Nama institusi minimal 3 karakter";
    }

    if (!formData.address || formData.address.trim().length < 10) {
      newErrors.address = "Alamat minimal 10 karakter";
    }

    if (!location) {
      newErrors.location = "Mohon pilih titik lokasi di peta";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Mohon lengkapi form dengan benar");
      return;
    }

    setIsLoading(true);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const payload = {
        ...formData,
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
      };

      const response = await axios.post(`${baseUrl}/institutions/register`, payload);

      // Success response
      toast.success("Registrasi berhasil! Silakan login.", {
        duration: 2000,
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: '500',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10b981',
        },
      });
      
      setTimeout(() => {
        router.push(`/login?email=${encodeURIComponent(formData.email)}`);
      }, 1500);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = 
        error.response?.data?.message || 
        error.message ||
        "Terjadi kesalahan saat registrasi. Silakan coba lagi.";
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
      
      {/* Left side - Illustration */}
      <div className="w-1/2 h-full bg-white/20 relative hidden lg:block">
        <Image
          src="/images/login-bg.png"
          alt="register-illustration"
          fill
          className="object-contain"
        />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-start gap-4 bg-black/10 text-primary px-8 lg:overflow-y-auto py-8">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="font-bold text-5xl mb-2">Daftar</h2>
          <p className="font-light text-primary/50">
            Registrasi untuk Rumah Sakit dan PMI
          </p>
       
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 w-3/4 max-w-2xl">
          <div className="col-span-2 flex flex-col gap-2 w-full">
            <label htmlFor="institution_type" className="font-bold">
              Tipe Institusi <span className="text-red-500">*</span>
            </label>
            <select
              id="institution_type"
              value={formData.institution_type}
              onChange={handleInputChange}
              className="shadow-lg h-12 border border-black/20 bg-white backdrop-blur rounded-xl px-4 focus:outline-none text-black/70"
              required
            >
              <option value="">Pilih Tipe Institusi</option>
              {INSTITUTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.institution_type && (
              <span className="text-red-500 text-sm">{errors.institution_type}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label htmlFor="email" className="font-bold">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="email@example.com"
              className="shadow-lg h-12 border border-black/20 placeholder:text-black/20 bg-white backdrop-blur rounded-xl px-4 focus:outline-none text-black/70"
              required
            />
            {errors.email && (
              <span className="text-red-500 text-sm">{errors.email}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label htmlFor="password" className="font-bold">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Minimal 6 karakter"
              className="shadow-lg h-12 border border-black/20 placeholder:text-black/20 bg-white backdrop-blur rounded-xl px-4 focus:outline-none text-black/70"
              required
            />
            {errors.password && (
              <span className="text-red-500 text-sm">{errors.password}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label htmlFor="institution_name" className="font-bold">
              Nama Rumah Sakit / PMI <span className="text-red-500">*</span>
            </label>
            <input
              id="institution_name"
              type="text"
              value={formData.institution_name}
              onChange={handleInputChange}
              placeholder="Nama institusi lengkap"
              className="shadow-lg h-12 border border-black/20 placeholder:text-black/20 bg-white backdrop-blur rounded-xl px-4 focus:outline-none text-black/70"
              required
            />
            {errors.institution_name && (
              <span className="text-red-500 text-sm">{errors.institution_name}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label htmlFor="phone_number" className="font-bold">
              Nomor Telepon
            </label>
            <input
              id="phone_number"
              type="tel"
              value={formData.phone_number || ""}
              onChange={handleInputChange}
              placeholder="08xxxxxxxxxx (opsional)"
              className="shadow-lg h-12 border border-black/20 placeholder:text-black/20 bg-white backdrop-blur rounded-xl px-4 focus:outline-none text-black/70"
            />
          </div>

          <div className="col-span-2 flex flex-col gap-2 w-full">
            <label htmlFor="address" className="font-bold">
              Pilih Titik Lokasi & Alamat <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-primary/60 mb-2">
              Pilih titik lokasi di peta, alamat akan otomatis terisi dari lokasi yang Anda pilih
            </p>
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={location || undefined}
              defaultAddress={formData.address}
            />
            <label htmlFor="address" className="font-bold mt-4">
              Alamat Terisi
            </label>
            <textarea
              id="address"
              value={formData.address}
              readOnly
              placeholder="Alamat akan otomatis terisi setelah Anda memilih titik lokasi"
              className="shadow-lg border border-black/20 placeholder:text-black/20 bg-white/50 backdrop-blur rounded-xl px-4 py-3 focus:outline-none text-black/70 resize-none min-h-20"
            />
            {errors.location && (
              <span className="text-red-500 text-sm">{errors.location}</span>
            )}
            {errors.address && (
              <span className="text-red-500 text-sm">{errors.address}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="col-span-2 cursor-pointer bg-primary text-white mt-2 shadow-lg px-12 py-3 rounded-xl font-bold text-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Mendaftar..." : "Daftar Sekarang"}
          </button>

          {/* Login Link */}
          <p className="col-span-2 text-center text-primary/70 mt-2">
            Sudah punya akun?{" "}
            <Link 
              href="/login" 
              className="text-primary font-bold hover:underline"
            >
              Login di sini
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
