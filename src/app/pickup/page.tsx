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
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-3xl text-white">Jadwal Pick Up</h2>
        </div>

        {/* Search Box - For PMI */}
        {user?.institution_type === 'pmi' && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="Masukkan kode unik (8 karakter) untuk konfirmasi cepat..."
                maxLength={8}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors uppercase tracking-wider font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setPrefilledCode("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ⚡ Ketik kode unik 8 karakter → Sistem otomatis membuka konfirmasi!
            </p>
          </div>
        )}

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter Jadwal</h3>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Date Filter - For all users */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                <Calendar size={14} className="text-gray-500" />
                Tanggal Pickup
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>

            {/* Patient Filter - For all users */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                <Package size={14} className="text-gray-500" />
                Nama Pasien
              </label>
              <input
                type="text"
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
                placeholder="Cari nama pasien..."
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
          </div>

          {/* Reset Filter Button */}
          {(dateFilter || patientFilter) && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setDateFilter("");
                  setPatientFilter("");
                }}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <X size={14} />
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-2 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === "all"
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter("scheduled")}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === "scheduled"
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Terjadwal
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
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
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500">Memuat jadwal...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Package size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Belum ada jadwal pickup</p>
            <p className="text-gray-400 text-sm">
              Jadwal pickup akan muncul setelah permintaan darah disetujui oleh PMI
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        {schedule.request.patient_name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          schedule.status
                        )}`}
                      >
                        {getStatusLabel(schedule.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      ID Permintaan: #{schedule.request_id.substring(0, 8)}
                    </p>
                  </div>

                  {/* Confirm Button - Only for PMI with scheduled status */}
                  {user?.institution_type === 'pmi' && schedule.status === "scheduled" && (
                    <button
                      onClick={() => handleConfirmClick(schedule)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all"
                    >
                      <CheckCircle size={18} />
                      Konfirmasi Selesai
                    </button>
                  )}
                </div>

                {/* Unique Code - Only for Hospital */}
                {user?.institution_type === 'hospital' && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary/20">
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
                  <div className="flex items-start gap-3">
                    <Calendar className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Tanggal
                      </p>
                      <p className="text-sm text-gray-800 font-semibold">
                        {formatDate(schedule.pickup_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Waktu</p>
                      <p className="text-sm text-gray-800 font-semibold">
                        {formatTime(schedule.pickup_time)} WIB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Droplet className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Darah
                      </p>
                      <p className="text-sm text-gray-800 font-semibold">
                        {schedule.request.blood_type} -{" "}
                        {schedule.request.quantity} Kantong
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Lokasi Pickup</p>
                      <p className="text-sm text-gray-800 font-semibold">
                        {schedule.pmi.institution_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {schedule.pmi.address}
                      </p>
                    </div>
                  </div>
                </div>

                {schedule.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Catatan dari PMI
                    </p>
                    <p className="text-sm text-gray-700">{schedule.notes}</p>
                  </div>
                )}

                {schedule.status === "completed" && schedule.confirmed_at && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 font-medium mb-1">
                      ✓ Pickup Selesai
                    </p>
                    <p className="text-xs text-gray-600">
                      Dikonfirmasi pada: {formatDate(schedule.confirmed_at)} pukul {formatTime(schedule.confirmed_at)}
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
