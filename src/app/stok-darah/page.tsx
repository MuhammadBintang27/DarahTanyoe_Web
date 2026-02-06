"use client";

import { useState, useEffect } from "react";
import { Droplet, Plus, Minus, Edit2, Save, X, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

import ProtectedRoute from "@/components/protectedRoute/protectedRoute";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/context/authContext";

interface BloodStock {
  id?: string;
  blood_type: string;
  quantity: number;
  last_updated?: string;
}

interface StockHistory {
  id: string;
  blood_type: string;
  change_type: 'add' | 'reduce' | 'used' | 'expired';
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  notes?: string;
  created_at: string;
}

const StokDarah: React.FC = () => {
  const { user } = useAuth();
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  
  const [stocks, setStocks] = useState<BloodStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>("");
  const [showAdjustModal, setShowAdjustModal] = useState<string | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'reduce'>('add');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);

  useEffect(() => {
    if (user?.id) {
      fetchBloodStock();
    }
  }, [user]);

  const fetchBloodStock = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/partners/${user.id}`
      );

      const stockData = response.data.data?.blood_stock || [];
      
      // Ensure all blood types are represented
      const completeStocks = bloodTypes.map((type) => {
        const existing = stockData.find((s: any) => s.blood_type === type);
        return existing || { blood_type: type, quantity: 0 };
      });

      setStocks(completeStocks);
    } catch (error) {
      console.error("Error fetching blood stock:", error);
      toast.error("Gagal memuat data stok darah");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!showAdjustModal || adjustmentAmount <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }

    const currentStock = stocks.find(s => s.blood_type === showAdjustModal);
    if (!currentStock) return;

    // Validasi: tidak boleh kurangi lebih dari stok yang ada
    if (adjustmentType === 'reduce' && adjustmentAmount > currentStock.quantity) {
      toast.error(`Tidak dapat mengurangi ${adjustmentAmount} kantong. Stok saat ini: ${currentStock.quantity}`);
      return;
    }

    try {
      setLoading(true);
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/blood-stock/adjust`,
        {
          institution_id: user?.id,
          blood_type: showAdjustModal,
          change_type: adjustmentType,
          quantity_change: adjustmentAmount,
          notes: adjustmentNotes || undefined
        }
      );

      toast.success(`Stok berhasil ${adjustmentType === 'add' ? 'ditambah' : 'dikurangi'}`);
      setShowAdjustModal(null);
      setAdjustmentAmount(0);
      setAdjustmentNotes("");
      fetchBloodStock();
    } catch (error: any) {
      console.error("Error adjusting stock:", error);
      toast.error(error.response?.data?.message || "Gagal mengubah stok");
    } finally {
      setLoading(false);
    }
  };

  const getStockColor = (quantity: number): string => {
    if (quantity === 0) return "bg-red-50 border-red-300";
    if (quantity < 10) return "bg-yellow-50 border-yellow-300";
    if (quantity < 20) return "bg-blue-50 border-blue-300";
    return "bg-green-50 border-green-300";
  };

  const getStockBadgeColor = (quantity: number): string => {
    if (quantity === 0) return "bg-red-500";
    if (quantity < 10) return "bg-yellow-500";
    if (quantity < 20) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStockStatus = (quantity: number): string => {
    if (quantity === 0) return "Kosong";
    if (quantity < 10) return "Rendah";
    if (quantity < 20) return "Sedang";
    return "Cukup";
  };

  return (
    <ProtectedRoute>
      <Toaster position="top-right" />
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-3xl text-white mb-2">Manajemen Stok Darah</h2>
            <p className="text-white/80 text-sm">Kelola stok darah di {user?.institution_name}</p>
          </div>
        </div>

        {/* Stock Cards */}
        {loading ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="relative border-2 rounded-xl p-6 bg-white">
                  <Skeleton className="absolute top-3 right-3 h-5 w-16 rounded-full" />
                  <div className="text-center mb-4 space-y-2">
                    <Skeleton className="mx-auto h-8 w-8" />
                    <Skeleton className="mx-auto h-6 w-12" />
                  </div>
                  <div className="text-center mb-4 space-y-2">
                    <Skeleton className="mx-auto h-8 w-14" />
                    <Skeleton className="mx-auto h-3 w-16" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="flex-1 h-10" />
                    <Skeleton className="flex-1 h-10" />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <Skeleton className="h-5 w-52 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stocks.map((stock) => (
              <div
                key={stock.blood_type}
                className={`relative border-2 rounded-xl p-6 transition-all hover:shadow-lg ${getStockColor(
                  stock.quantity
                )}`}
              >
                {/* Stock Status Badge */}
                <div className={`absolute top-3 right-3 ${getStockBadgeColor(stock.quantity)} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                  {getStockStatus(stock.quantity)}
                </div>

                {/* Blood Type */}
                <div className="text-center mb-4">
                  <Droplet className="mx-auto mb-2 text-red-500" size={32} />
                  <p className="text-2xl font-bold text-gray-800">{stock.blood_type}</p>
                </div>

                {/* Quantity Display */}
                <div className="text-center mb-4">
                  <p className="text-4xl font-extrabold text-gray-900">{stock.quantity}</p>
                  <p className="text-xs text-gray-600 font-medium">Kantong</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowAdjustModal(stock.blood_type);
                      setAdjustmentType('add');
                      setAdjustmentAmount(0);
                      setAdjustmentNotes("");
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus size={16} />
                    Tambah
                  </button>
                  <button
                    onClick={() => {
                      setShowAdjustModal(stock.blood_type);
                      setAdjustmentType('reduce');
                      setAdjustmentAmount(0);
                      setAdjustmentNotes("");
                    }}
                    disabled={stock.quantity === 0}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                    Kurangi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stock Legend */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Keterangan Status Stok</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-700"><strong>Kosong:</strong> 0 kantong</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-700"><strong>Rendah:</strong> 1-9 kantong</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700"><strong>Sedang:</strong> 10-19 kantong</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700"><strong>Cukup:</strong> 20+ kantong</span>
            </div>
          </div>
        </div>

        {/* Adjustment Modal */}
        {showAdjustModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {adjustmentType === 'add' ? 'Tambah' : 'Kurangi'} Stok {showAdjustModal}
                </h3>
                <button
                  onClick={() => setShowAdjustModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Stok saat ini: <strong>{stocks.find(s => s.blood_type === showAdjustModal)?.quantity || 0} kantong</strong>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jumlah Kantong *
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustmentAmount || ""}
                  onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-semibold"
                  placeholder="Masukkan jumlah"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catatan (opsional)
                </label>
                <textarea
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Contoh: Donasi dari kegiatan donor darah"
                />
              </div>

              {adjustmentType === 'reduce' && adjustmentAmount > (stocks.find(s => s.blood_type === showAdjustModal)?.quantity || 0) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-2">
                  <AlertTriangle size={20} className="text-red-500 mt-0.5" />
                  <p className="text-sm text-red-700">
                    Jumlah pengurangan melebihi stok yang tersedia
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdjustModal(null)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleAdjustStock}
                  disabled={loading || adjustmentAmount <= 0 || (adjustmentType === 'reduce' && adjustmentAmount > (stocks.find(s => s.blood_type === showAdjustModal)?.quantity || 0))}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    adjustmentType === 'add' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {loading ? "Menyimpan..." : adjustmentType === 'add' ? 'Tambah Stok' : 'Kurangi Stok'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default StokDarah;
