"use client";

import { useState, useEffect } from "react";
import { MapPin, Droplet, Phone, Mail } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

import ProtectedRoute from "@/components/protectedRoute/protectedRoute";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/context/authContext";

interface BloodStock {
  blood_type: string;
  quantity: number;
  expiry_date?: string;
}

interface PMIInfo {
  id: string;
  institution_name: string;
  address: string;
  phone_number?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  blood_stock: BloodStock[];
}

const InformasiPMI: React.FC = () => {
  const { user } = useAuth();
  const [pmiList, setPmiList] = useState<PMIInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPMI, setSelectedPMI] = useState<string>("");

  useEffect(() => {
    fetchPMIList();
  }, []);

  const fetchPMIList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/partners`
      );

      const institutions = response.data.data || [];
      const pmiInstitutions = institutions.filter(
        (inst: any) => inst.institution_type === "pmi"
      );

      setPmiList(pmiInstitutions);
      if (pmiInstitutions.length > 0) {
        setSelectedPMI(pmiInstitutions[0].id);
      }
    } catch (error) {
      console.error("Error fetching PMI list:", error);
      toast.error("Gagal memuat data PMI");
    } finally {
      setLoading(false);
    }
  };

  const selectedPMIData = pmiList.find((pmi) => pmi.id === selectedPMI);

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const getStockQuantity = (bloodType: string): number => {
    const stock = selectedPMIData?.blood_stock?.find(
      (s) => s.blood_type === bloodType
    );
    return stock?.quantity || 0;
  };

  const getStockColor = (quantity: number): string => {
    if (quantity === 0) return "bg-red-100 text-red-800 border-red-300";
    if (quantity < 10) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (quantity < 20) return "bg-blue-100 text-blue-800 border-blue-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-3xl text-white">Informasi PMI</h2>
        </div>

        {/* PMI Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Pilih Lokasi PMI
          </label>
          <select
            value={selectedPMI}
            onChange={(e) => setSelectedPMI(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 disabled:opacity-60 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            {pmiList.map((pmi) => (
              <option key={pmi.id} value={pmi.id}>
                {pmi.institution_name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <>
            {/* Skeleton: PMI Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <Skeleton className="h-5 w-40 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-5 h-5 mt-1" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skeleton: Blood Stock */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Skeleton className="w-6 h-6" />
                <Skeleton className="h-5 w-56" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="p-6 rounded-xl border-2 border-gray-200">
                    <div className="text-center space-y-2">
                      <Skeleton className="h-6 w-12 mx-auto" />
                      <Skeleton className="h-8 w-10 mx-auto" />
                      <Skeleton className="h-3 w-14 mx-auto" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : selectedPMIData ? (
          <>
            {/* PMI Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Informasi PMI
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-primary mt-1" size={20} />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Alamat</p>
                    <p className="text-sm text-gray-800">
                      {selectedPMIData.address}
                    </p>
                  </div>
                </div>
                {selectedPMIData.phone_number && (
                  <div className="flex items-start gap-3">
                    <Phone className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Telepon
                      </p>
                      <p className="text-sm text-gray-800">
                        {selectedPMIData.phone_number}
                      </p>
                    </div>
                  </div>
                )}
                {selectedPMIData.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Email</p>
                      <p className="text-sm text-gray-800">
                        {selectedPMIData.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Blood Stock */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Droplet className="text-primary" size={24} />
                <h3 className="text-xl font-bold text-gray-800">
                  Stok Darah Tersedia
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {bloodTypes.map((bloodType) => {
                  const quantity = getStockQuantity(bloodType);
                  return (
                    <div
                      key={bloodType}
                      className={`p-6 rounded-xl border-2 ${getStockColor(
                        quantity
                      )} transition-all hover:scale-105`}
                    >
                      <div className="text-center">
                        <p className="text-2xl font-bold mb-1">{bloodType}</p>
                        <p className="text-3xl font-extrabold mb-1">
                          {quantity}
                        </p>
                        <p className="text-xs font-medium">Kantong</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                  <span className="text-gray-600">Kosong</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
                  <span className="text-gray-600">Rendah (1-9)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
                  <span className="text-gray-600">Sedang (10-19)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                  <span className="text-gray-600">Cukup (20+)</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500">Tidak ada data PMI</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default InformasiPMI;
