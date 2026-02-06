"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Droplet, Package, CheckCircle, Copy, X } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

import ProtectedRoute from "@/components/protectedRoute/protectedRoute";
import { useAuth } from "@/context/authContext";
import { ConfirmPickupModal } from "@/components/pickup/ConfirmPickupModal";

interface PickupSchedule {
  id: string;
  request_id: string;
  pickup_date: string;
  pickup_time: string;
  pickup_location: string;
  unique_code: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  confirmed_at?: string;
  pmi: {
    institution_name: string;
    address: string;
    phone_number: string;
  };
  hospital: {
    institution_name: string;
    address: string;
    phone_number: string;
  };
  request: {
    patient_name: string;
    blood_type: string;
    quantity: number;
    urgency_level: string;
  };
}

const PickUp: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<PickupSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "scheduled" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [patientFilter, setPatientFilter] = useState("");
  const [confirmSchedule, setConfirmSchedule] = useState<PickupSchedule | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [prefilledCode, setPrefilledCode] = useState("");

  useEffect(() => {
    fetchPickupSchedules();
  }, [user]);

  // Auto-trigger confirmation modal when searching with unique code
  useEffect(() => {
    // Only for PMI and when search query is exactly 8 characters (unique code format)
    if (user?.institution_type === 'pmi' && searchQuery.length === 8) {
      const upperQuery = searchQuery.toUpperCase();
      const matchingSchedules = schedules.filter(
        (schedule) => 
          schedule.unique_code === upperQuery && 
          schedule.status === 'scheduled'
      );
      
      // If exactly one match found, auto-open confirmation modal
      if (matchingSchedules.length === 1) {
        setConfirmSchedule(matchingSchedules[0]);
        setPrefilledCode(upperQuery);
      }
    }
  }, [searchQuery, schedules, user]);

  const fetchPickupSchedules = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/pickup-schedules`,
        {
          params: {
            userId: user.id,
            userType: user.institution_type
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSchedules(response.data.data || []);
    } catch (error: any) {
      console.error("Error fetching pickup schedules:", error);
      if (error.response?.status !== 404) {
        toast.error("Gagal memuat jadwal pickup");
      }
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const copyUniqueCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kode unik berhasil disalin");
  };

  const handleConfirmClick = (schedule: PickupSchedule) => {
    setConfirmSchedule(schedule);
  };

  const handleConfirmPickup = async (uniqueCode: string) => {
    if (!confirmSchedule) return;

    try {
      setConfirmLoading(true);
      const token = localStorage.getItem("authToken");
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/pickup-schedules/${confirmSchedule.id}/confirm`,
        { 
          uniqueCode,
          pmiId: user?.id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(response.data.message || "Pickup berhasil dikonfirmasi");
      setConfirmSchedule(null);
      fetchPickupSchedules();
    } catch (error: any) {
      console.error("Error confirming pickup:", error);
      toast.error(error.response?.data?.message || "Gagal mengkonfirmasi pickup");
    } finally {
      setConfirmLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string): string => {
    return timeString.substring(0, 5);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "scheduled":
        return "Terjadwal";
      case "completed":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  const filteredSchedules = schedules.filter((schedule) => {
    // Filter by status
    if (filter !== "all" && schedule.status !== filter) return false;
    
    // Filter by date
    if (dateFilter && schedule.pickup_date !== dateFilter) return false;
    
    // Filter by patient name (for all users)
    if (patientFilter) {
      if (!schedule.request.patient_name.toLowerCase().includes(patientFilter.toLowerCase())) {
        return false;
      }
    }
    
    // Filter by search query (unique code, patient name, or hospital name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesCode = schedule.unique_code.toLowerCase().includes(query);
      const matchesPatient = schedule.request.patient_name.toLowerCase().includes(query);
      const matchesHospital = user?.institution_type === 'pmi' 
        ? schedule.hospital.institution_name.toLowerCase().includes(query)
        : schedule.pmi.institution_name.toLowerCase().includes(query);
      
      return matchesCode || matchesPatient || matchesHospital;
    }
    
    return true;
  });

  return (
    <ProtectedRoute>
      <Toaster position="top-right" />
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="font-bold text-3xl text-white">Jadwal Pick Up</h2>
          <p className="mt-2 text-lg text-white font-semibold">Kelola jadwal pengambilan darah</p>
        </div>

        {/* Search Box - For PMI */}
        {user?.institution_type === 'pmi' && (
          <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Konfirmasi Cepat
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="Masukkan kode unik (8 karakter)..."
                maxLength={8}
                className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors uppercase tracking-wider font-mono text-lg font-bold"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setPrefilledCode("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
              <span className="text-blue-600 font-medium">💡</span>
              Ketik 8 karakter untuk membuka konfirmasi otomatis
            </p>
          </div>
        )}

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Filter</h3>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Date Filter - For all users */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Tanggal Pickup
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>

            {/* Patient Filter - For all users */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Nama Pasien
              </label>
              <input
                type="text"
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
                placeholder="Cari nama pasien..."
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Reset Filter Button */}
          {(dateFilter || patientFilter) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setDateFilter("");
                  setPatientFilter("");
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors border border-blue-200"
              >
                <X size={14} />
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-2 flex gap-2 border border-gray-200">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
              filter === "all"
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter("scheduled")}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
              filter === "scheduled"
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Terjadwal
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
              filter === "completed"
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Selesai
          </button>
        </div>

        {/* Schedule List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat jadwal...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-900 text-lg font-bold mb-2">Belum Ada Jadwal</p>
            <p className="text-gray-600 text-sm">
              Jadwal pickup akan muncul setelah permintaan darah disetujui oleh PMI
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {schedule.request.patient_name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                          schedule.status === 'completed'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : schedule.status === 'scheduled'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {getStatusLabel(schedule.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      ID: {schedule.request_id.substring(0, 8)}
                    </p>
                  </div>

                  {/* Confirm Button - Only for PMI with scheduled status */}
                  {user?.institution_type === 'pmi' && schedule.status === "scheduled" && (
                    <button
                      onClick={() => handleConfirmClick(schedule)}
                      className="bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all border border-green-200"
                    >
                      <CheckCircle size={18} />
                      Konfirmasi
                    </button>
                  )}
                </div>

                {/* Unique Code - Only for Hospital */}
                {user?.institution_type === 'hospital' && (
                  <div className="mb-5 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary/20">
                    <p className="text-xs text-gray-600 font-medium mb-2">
                      Kode Unik Pickup
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-bold text-primary tracking-wider">
                        {schedule.unique_code}
                      </p>
                      <button
                        onClick={() => copyUniqueCode(schedule.unique_code)}
                        className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg transition-all"
                        title="Salin kode"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Tunjukkan kode ini saat mengambil darah di PMI
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">
                      Tanggal
                    </p>
                    <p className="text-sm text-gray-900 font-bold">
                      {formatDate(schedule.pickup_date)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Waktu</p>
                    <p className="text-sm text-gray-900 font-bold">
                      {formatTime(schedule.pickup_time)} WIB
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">
                      Darah
                    </p>
                    <p className="text-sm text-gray-900 font-bold">
                      {schedule.request.blood_type} • {schedule.request.quantity} Kantong
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Lokasi</p>
                    <p className="text-sm text-gray-900 font-bold truncate" title={schedule.pmi.institution_name}>
                      {schedule.pmi.institution_name}
                    </p>
                  </div>
                </div>

                {schedule.notes && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-700 font-semibold mb-1">
                      Catatan dari PMI
                    </p>
                    <p className="text-sm text-gray-900">{schedule.notes}</p>
                  </div>
                )}

                {schedule.status === "completed" && schedule.confirmed_at && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 font-bold mb-1">
                      ✓ Pickup Selesai
                    </p>
                    <p className="text-xs text-gray-700">
                      Dikonfirmasi: {formatDate(schedule.confirmed_at)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Confirm Pickup Modal - Only for PMI */}
        {user?.institution_type === 'pmi' && confirmSchedule && (
          <ConfirmPickupModal
            isOpen={!!confirmSchedule}
            loading={confirmLoading}
            scheduleId={confirmSchedule.id}
            patientName={confirmSchedule.request.patient_name}
            bloodType={confirmSchedule.request.blood_type}
            quantity={confirmSchedule.request.quantity}
            hospitalName={confirmSchedule.hospital.institution_name}
            prefilledCode={prefilledCode}
            onClose={() => {
              setConfirmSchedule(null);
              setPrefilledCode("");
            }}
            onSubmit={handleConfirmPickup}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};


export default PickUp;
