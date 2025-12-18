"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Package, TrendingDown, TrendingUp, AlertCircle, Filter, X } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

import ProtectedRoute from "@/components/protectedRoute/protectedRoute";
import { useAuth } from "@/context/authContext";

interface BloodStock {
  blood_type: string;
  rhesus: string;
  component_type: string;
  collection_date: string;
  expiry_date: string;
}

interface BloodRequest {
  patient_name: string;
  urgency_level: string;
  requester: {
    institution_name: string;
  };
}

interface StockHistory {
  id: string;
  institution_id: string;
  blood_type: string;
  change_type: "add" | "reduce" | "used" | "expired";
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  notes?: string;
  created_at: string;
  institution: {
    institution_name: string;
    address: string;
  };
}

interface HistoryStats {
  totalAdded: number;
  totalUsed: number;
  totalExpired: number;
  byBloodType: {
    [key: string]: {
      added: number;
      used: number;
      expired: number;
    };
  };
}

const RiwayatStok: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("");
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    if (user?.id) {
      fetchHistory();
      fetchStats();
    }
  }, [user, actionTypeFilter, bloodTypeFilter, startDate, endDate]);

  const fetchHistory = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      
      const params: any = {
        pmiId: user.id,
      };

      if (actionTypeFilter) params.actionType = actionTypeFilter;
      if (bloodTypeFilter) params.bloodType = bloodTypeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/blood-stock-history`,
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setHistory(response.data.data || []);
    } catch (error: any) {
      console.error("Error fetching history:", error);
      toast.error("Gagal memuat riwayat stok");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user?.id) return;

    try {
      const token = localStorage.getItem("authToken");
      
      const params: any = {
        pmiId: user.id,
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/blood-stock-history/stats`,
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setStats(response.data.data);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
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

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionColor = (actionType: string): string => {
    switch (actionType) {
      case "add":
        return "bg-green-100 text-green-800";
      case "used":
        return "bg-blue-100 text-blue-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "reduce":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionLabel = (actionType: string): string => {
    switch (actionType) {
      case "add":
        return "Ditambahkan";
      case "used":
        return "Digunakan";
      case "expired":
        return "Kadaluarsa";
      case "reduce":
        return "Dikurangi";
      default:
        return actionType;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "add":
        return <TrendingUp size={18} className="text-green-600" />;
      case "used":
        return <TrendingDown size={18} className="text-blue-600" />;
      case "expired":
        return <AlertCircle size={18} className="text-red-600" />;
      case "reduce":
        return <TrendingDown size={18} className="text-yellow-600" />;
      default:
        return null;
    }
  };

  const resetFilters = () => {
    setActionTypeFilter("");
    setBloodTypeFilter("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters = actionTypeFilter || bloodTypeFilter || startDate || endDate;

  // Redirect if not PMI
  useEffect(() => {
    if (user && user.institution_type !== 'pmi') {
      window.location.href = '/';
    }
  }, [user]);

  return (
    <ProtectedRoute>
      <Toaster position="top-right" />
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-3xl text-white">Riwayat Stok Darah</h2>
            <p className="text-gray-300 text-sm mt-1">
              Pantau pergerakan stok darah yang ditambahkan, digunakan, atau kadaluarsa
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all shadow-md"
          >
            <Filter size={18} />
            Filter
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium opacity-90">Total Ditambahkan</p>
                <TrendingUp size={24} />
              </div>
              <p className="text-4xl font-bold">{stats.totalAdded}</p>
              <p className="text-xs opacity-75 mt-1">kantong darah</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium opacity-90">Total Digunakan</p>
                <TrendingDown size={24} />
              </div>
              <p className="text-4xl font-bold">{stats.totalUsed}</p>
              <p className="text-xs opacity-75 mt-1">kantong darah</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium opacity-90">Total Kadaluarsa</p>
                <AlertCircle size={24} />
              </div>
              <p className="text-4xl font-bold">{stats.totalExpired}</p>
              <p className="text-xs opacity-75 mt-1">kantong darah</p>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter Riwayat</h3>
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
              {/* Action Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Tipe Aksi
                </label>
                <select
                  value={actionTypeFilter}
                  onChange={(e) => setActionTypeFilter(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-primary transition-colors text-sm"
                >
                  <option value="">Semua</option>
                  <option value="add">Ditambahkan</option>
                  <option value="used">Digunakan</option>
                  <option value="expired">Kadaluarsa</option>
                  <option value="reduce">Dikurangi</option>
                </select>
              </div>

              {/* Blood Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Golongan Darah
                </label>
                <select
                  value={bloodTypeFilter}
                  onChange={(e) => setBloodTypeFilter(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-primary transition-colors text-sm"
                >
                  <option value="">Semua</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <X size={14} />
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        )}

        {/* History List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500">Memuat riwayat...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Package size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Belum ada riwayat stok</p>
            <p className="text-gray-400 text-sm">
              Riwayat pergerakan stok darah akan muncul di sini
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {history.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {getActionIcon(record.change_type)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(
                            record.change_type
                          )}`}
                        >
                          {getActionLabel(record.change_type)}
                        </span>
                        <span className="text-lg font-bold text-gray-800">
                          {record.quantity_change} kantong
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Sisa stok: {record.new_quantity} kantong
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Calendar size={14} />
                      {formatDate(record.created_at)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={14} />
                      {formatTime(record.created_at)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Golongan Darah</p>
                    <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                      {record.blood_type}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Kuantitas Sebelumnya</p>
                    <p className="text-sm text-gray-800 font-semibold">
                      {record.previous_quantity} kantong
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Kuantitas Baru</p>
                    <p className="text-sm text-gray-800 font-semibold">
                      {record.new_quantity} kantong
                    </p>
                  </div>
                </div>

                {record.notes && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-xs text-blue-600 font-medium mb-1">Catatan</p>
                    <p className="text-sm text-gray-700">{record.notes}</p>
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

export default RiwayatStok;
