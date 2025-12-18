"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Droplet, Package, CheckCircle } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

import ProtectedRoute from "@/components/protectedRoute/protectedRoute";
import { useAuth } from "@/context/authContext";

interface PickupSchedule {
  id: string;
  request_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  blood_request: {
    patient_name: string;
    blood_type: string;
    quantity: number;
    partners: {
      name: string;
      address: string;
    };
  };
}

const PickUp: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<PickupSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "scheduled" | "completed">("all");

  useEffect(() => {
    fetchPickupSchedules();
  }, [user]);

  const fetchPickupSchedules = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // TODO: Replace with actual API endpoint when available
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/pickup/${user.id}`
      );
      setSchedules(response.data.data || []);
    } catch (error) {
      console.error("Error fetching pickup schedules:", error);
      // For now, show empty state
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPickup = async (scheduleId: string) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/pickup/${scheduleId}/complete`
      );
      toast.success("Pickup berhasil dikonfirmasi");
      fetchPickupSchedules();
    } catch (error) {
      console.error("Error confirming pickup:", error);
      toast.error("Gagal mengkonfirmasi pickup");
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
    if (filter === "all") return true;
    return schedule.status === filter;
  });

  return (
    <ProtectedRoute>
      <Toaster position="top-right" />
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-3xl text-white">Jadwal Pick Up</h2>
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
                        {schedule.blood_request.patient_name}
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

                  {schedule.status === "scheduled" && (
                    <button
                      onClick={() => handleConfirmPickup(schedule.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all"
                    >
                      <CheckCircle size={18} />
                      Konfirmasi Diambil
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Tanggal
                      </p>
                      <p className="text-sm text-gray-800 font-semibold">
                        {formatDate(schedule.scheduled_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Waktu</p>
                      <p className="text-sm text-gray-800 font-semibold">
                        {formatTime(schedule.scheduled_time)} WIB
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
                        {schedule.blood_request.blood_type} -{" "}
                        {schedule.blood_request.quantity} Kantong
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="text-primary mt-1" size={20} />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Lokasi</p>
                      <p className="text-sm text-gray-800 font-semibold">
                        {schedule.blood_request.partners.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {schedule.blood_request.partners.address}
                      </p>
                    </div>
                  </div>
                </div>

                {schedule.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Catatan
                    </p>
                    <p className="text-sm text-gray-700">{schedule.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default PickUp;
