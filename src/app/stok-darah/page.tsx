"use client";

import { useState, useEffect } from "react";
import { Droplet, Plus, Minus, Edit2, Save, X, TrendingUp, TrendingDown, AlertTriangle, Filter } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

import ProtectedRoute from "@/components/protectedRoute/protectedRoute";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/context/authContext";
import { ComponentType, getAllComponentTypes, getComponentInfo, formatComponentType, getComponentBadgeClasses } from '@/utils/componentHelpers';

interface BloodStock {
  id?: string;
  blood_type: string;
  component_type: ComponentType;
  quantity: number;
  updated_at?: string;
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
  const componentTypes = getAllComponentTypes();
  
  const [stocks, setStocks] = useState<BloodStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<ComponentType>('WB');
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>("");
  const [showAdjustModal, setShowAdjustModal] = useState<{bloodType: string, componentType: ComponentType} | null>(null);
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
      console.log('📊 Raw stock data from API:', stockData);
      console.log('📊 Component types in data:', [...new Set(stockData.map((s: any) => s.component_type))]);
      
      // Aggregate quantities for each blood type AND component type combination
      const aggregatedStocks: BloodStock[] = [];
      
      componentTypes.forEach((comp) => {
        bloodTypes.forEach((type) => {
          const matchingStocks = stockData.filter(
            (s: any) => s.blood_type === type && (s.component_type || 'WB') === comp.value
          );
          const totalQuantity = matchingStocks.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0);
          
          if (matchingStocks.length > 0) {
            console.log(`✅ ${type} ${comp.value}: ${matchingStocks.length} records, total ${totalQuantity} units`);
          }
          
          aggregatedStocks.push({
            blood_type: type,
            component_type: comp.value,
            quantity: totalQuantity,
            updated_at: matchingStocks[0]?.updated_at
          });
        });
      });

      console.log('📊 Aggregated stocks:', aggregatedStocks.filter(s => s.quantity > 0));
      setStocks(aggregatedStocks);
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

    const currentStock = stocks.find(
      s => s.blood_type === showAdjustModal.bloodType && s.component_type === showAdjustModal.componentType
    );
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
          blood_type: showAdjustModal.bloodType,
          component_type: showAdjustModal.componentType,
          change_type: adjustmentType,
          quantity_change: adjustmentAmount,
          notes: adjustmentNotes || undefined
        }
      );

      const componentInfo = getComponentInfo(showAdjustModal.componentType);
      toast.success(`Stok ${componentInfo.label} berhasil ${adjustmentType === 'add' ? 'ditambah' : 'dikurangi'}`);
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
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-bold text-3xl text-gray-800 mb-2">Manajemen Stok Darah</h2>
              <p className="text-gray-600 text-sm">Kelola dan pantau ketersediaan stok darah di <span className="font-semibold">{user?.institution_name}</span></p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
              <Droplet className="text-primary" size={20} />
              <span className="text-sm font-bold text-primary">PMI {user?.institution_name?.split(' ')[1]}</span>
            </div>
          </div>
        </div>

        {/* Component Type Filter */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-600" />
            <h3 className="font-bold text-base text-gray-800">Filter Jenis Komponen Darah</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {componentTypes.map((comp) => (
              <button
                key={comp.value}
                onClick={() => setSelectedComponent(comp.value)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedComponent === comp.value
                    ? `${comp.bgColor} ${comp.color} ring-2 ring-offset-2 ring-primary shadow-md`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                }`}
              >
                {comp.label} - {comp.fullName}
              </button>
            ))}
          </div>
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-700 leading-relaxed">
              <span className="font-semibold">{getComponentInfo(selectedComponent).fullName}:</span> {getComponentInfo(selectedComponent).description}
            </p>
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
            {stocks
              .filter(s => s.component_type === selectedComponent)
              .map((stock) => {
                const componentInfo = getComponentInfo(stock.component_type);
                return (
                  <div
                    key={`${stock.blood_type}-${stock.component_type}`}
                    className={`relative border-2 rounded-xl p-4 transition-all hover:shadow-xl ${getStockColor(
                      stock.quantity
                    )}`}
                  >
                    {/* Stock Status Badge */}
                    <div className={`absolute top-2 right-2 ${getStockBadgeColor(stock.quantity)} text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm`}>
                      {getStockStatus(stock.quantity)}
                    </div>

                    {/* Blood Type with Icon */}
                    <div className="text-center mb-3">
                      <div className="relative inline-block mb-1.5">
                        <Droplet className="text-red-500 drop-shadow-md" size={36} fill="currentColor" />
                      </div>
                      <p className="text-2xl font-bold text-gray-800 mb-1.5">{stock.blood_type}</p>
                      <div className="inline-block">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-300">
                          {componentInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Display */}
                    <div className="text-center mb-3 py-2">
                      <p className="text-4xl font-extrabold text-gray-900 mb-0.5">{stock.quantity}</p>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Kantong</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowAdjustModal({bloodType: stock.blood_type, componentType: stock.component_type});
                          setAdjustmentType('add');
                          setAdjustmentAmount(0);
                          setAdjustmentNotes("");
                        }}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-md"
                      >
                        <Plus size={16} />
                        Tambah
                      </button>
                      <button
                        onClick={() => {
                          setShowAdjustModal({bloodType: stock.blood_type, componentType: stock.component_type});
                          setAdjustmentType('reduce');
                          setAdjustmentAmount(0);
                          setAdjustmentNotes("");
                        }}
                        disabled={stock.quantity === 0}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                      >
                        <Minus size={16} />
                        Kurangi
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Stock Legend */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            Keterangan Status Stok
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
              <div>
                <p className="text-sm font-bold text-red-700">Kosong</p>
                <p className="text-xs text-red-600">0 kantong</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="w-4 h-4 bg-yellow-500 rounded-full flex-shrink-0"></div>
              <div>
                <p className="text-sm font-bold text-yellow-700">Rendah</p>
                <p className="text-xs text-yellow-600">1-9 kantong</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
              <div>
                <p className="text-sm font-bold text-blue-700">Sedang</p>
                <p className="text-xs text-blue-600">10-19 kantong</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
              <div>
                <p className="text-sm font-bold text-green-700">Cukup</p>
                <p className="text-xs text-green-600">20+ kantong</p>
              </div>
            </div>
          </div>
        </div>

        {/* Adjustment Modal */}
        {showAdjustModal && (() => {
          const currentStock = stocks.find(
            s => s.blood_type === showAdjustModal.bloodType && s.component_type === showAdjustModal.componentType
          );
          const componentInfo = getComponentInfo(showAdjustModal.componentType);
          
          return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {adjustmentType === 'add' ? 'Tambah' : 'Kurangi'} Stok
                  </h3>
                  <button
                    onClick={() => setShowAdjustModal(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Blood Type & Component Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Golongan Darah</p>
                      <p className="text-3xl font-bold text-gray-800">{showAdjustModal.bloodType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Komponen</p>
                      <span className={`inline-block text-sm font-bold px-3 py-1.5 rounded-lg ${componentInfo.bgColor} ${componentInfo.color}`}>
                        {componentInfo.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold text-gray-700">Stok Saat Ini</p>
                    <p className="text-2xl font-bold text-gray-900">{currentStock?.quantity || 0} <span className="text-sm font-normal text-gray-600">kantong</span></p>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {componentInfo.description}
                  </p>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Jumlah Kantong *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adjustmentAmount || ""}
                    onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-semibold bg-gray-50"
                    placeholder="Masukkan jumlah"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Catatan (opsional)
                  </label>
                  <textarea
                    value={adjustmentNotes}
                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-gray-50"
                    placeholder="Contoh: Donasi dari kegiatan donor darah"
                  />
                </div>

                {adjustmentType === 'reduce' && adjustmentAmount > (currentStock?.quantity || 0) && (
                <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-2">
                  <AlertTriangle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">
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
                  disabled={loading || adjustmentAmount <= 0 || (adjustmentType === 'reduce' && adjustmentAmount > (currentStock?.quantity || 0))}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md ${
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
          );
        })()}
      </div>
    </ProtectedRoute>
  );
};

export default StokDarah;
