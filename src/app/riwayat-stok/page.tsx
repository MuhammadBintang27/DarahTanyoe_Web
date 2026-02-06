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
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  
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
  }, [user, actionTypeFilter, bloodTypeFilter, startDate, endDate, currentPage]);

  const fetchHistory = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      
      const params: any = {
        pmiId: user.id,
        page: currentPage,
        limit: itemsPerPage,
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
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalItems(response.data.pagination?.totalItems || 0);
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
    setCurrentPage(1);
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
        <div className="mb-6">
          <h2 className="font-bold text-3xl text-white">Riwayat Stok Darah</h2>
          <p className="mt-2 text-lg text-white font-semibold">
            Pantau pergerakan stok darah Anda
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-700">Total Ditambahkan</p>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-black text-gray-900">{stats.totalAdded}</p>
              <p className="text-xs text-gray-600 mt-1">kantong darah</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-700">Total Digunakan</p>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingDown size={20} className="text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-black text-gray-900">{stats.totalUsed}</p>
              <p className="text-xs text-gray-600 mt-1">kantong darah</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-700">Total Kadaluarsa</p>
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-600" />
                </div>
              </div>
              <p className="text-3xl font-black text-gray-900">{stats.totalExpired}</p>
              <p className="text-xs text-gray-600 mt-1">kantong darah</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-900">Filter</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
            >
              {showFilters ? <X size={14} /> : <Filter size={14} />}
              {showFilters ? 'Tutup' : 'Tampilkan'}
            </button>
          </div>
          
          {showFilters && (
            <>
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
                {/* Action Type Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Tipe Aksi
                  </label>
                  <select
                    value={actionTypeFilter}
                    onChange={(e) => setActionTypeFilter(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors text-sm"
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
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Golongan Darah
                  </label>
                  <select
                    value={bloodTypeFilter}
                    onChange={(e) => setBloodTypeFilter(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors text-sm"
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
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Reset Button */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors border border-blue-200"
                  >
                    <X size={14} />
                    Reset Filter
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* History List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat riwayat...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-900 text-lg font-bold mb-2">Belum Ada Riwayat</p>
            <p className="text-gray-600 text-sm">
              Riwayat pergerakan stok darah akan muncul di sini
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {history.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                            record.change_type === 'add'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : record.change_type === 'used'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : record.change_type === 'expired'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          {getActionLabel(record.change_type)}
                        </span>
                        <span className="text-2xl font-black text-gray-900">
                          {record.quantity_change}
                        </span>
                        <span className="text-sm text-gray-600 font-medium">kantong</span>
                      </div>
                      <p className="text-xs text-gray-600 font-semibold">
                        Sisa Stok: {record.new_quantity} kantong
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-gray-700 font-semibold mb-1">
                      {formatDate(record.created_at)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatTime(record.created_at)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Golongan Darah</p>
                    <p className="text-sm text-gray-900 font-bold">
                      {record.blood_type}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Sebelumnya</p>
                    <p className="text-sm text-gray-900 font-bold">
                      {record.previous_quantity} kantong
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Sekarang</p>
                    <p className="text-sm text-gray-900 font-bold">
                      {record.new_quantity} kantong
                    </p>
                  </div>
                </div>

                {record.notes && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-700 font-bold mb-1">Catatan</p>
                    <p className="text-sm text-gray-900">{record.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && history.length > 0 && totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} riwayat
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sebelumnya
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default RiwayatStok;
