"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, Info, AlertCircle, Package, ClipboardList, Check, Loader2 } from "lucide-react";
import { useAllocation } from "@/hooks/useAllocation";

interface CreatePickupModalProps {
  isOpen: boolean;
  loading?: boolean;
  requestId: string;
  patientName: string;
  bloodType: string;
  quantity: number;
  hospitalName: string;
  onClose: () => void;
  onSubmit: (data: { 
    pickupDate: string; 
    pickupTime: string; 
    notes?: string;
    allocations?: Array<{ allocation_id: string; quantity_picked_up: number }>;
    free_stock?: Array<{ stock_id: string; quantity_picked_up: number }>;
  }) => void;
}

export const CreatePickupModal: React.FC<CreatePickupModalProps> = ({
  isOpen,
  loading = false,
  requestId,
  patientName,
  bloodType,
  quantity,
  hospitalName,
  onClose,
  onSubmit,
}) => {
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");
  const [allocationQty, setAllocationQty] = useState<Record<string, number>>({});
  const [freeStockQty, setFreeStockQty] = useState<Record<string, number>>({});
  const [useFreeStock, setUseFreeStock] = useState(false); // Track if using free stock

  // Fetch allocations WITH free stock options
  const { 
    allocations, 
    freeStock,
    summary, 
    loading: allocLoading, 
    getBloodWithFreeStock 
  } = useAllocation(requestId);

  useEffect(() => {
    if (isOpen && requestId) {
      getBloodWithFreeStock(requestId);
    }
  }, [isOpen, requestId, getBloodWithFreeStock]);

  // Initialize allocation quantities - AUTO FILL jika sudah cukup
  useEffect(() => {
    const initialQty: Record<string, number> = {};
    const initialFreeStockQty: Record<string, number> = {};
    let totalAvailable = 0;
    
    (allocations || []).forEach((alloc) => {
      if (alloc && alloc.allocation_id) {
        const pending = alloc.quantity_allocated - (alloc.quantity_picked_up || 0);
        initialQty[alloc.allocation_id] = pending;
        totalAvailable += pending;
      }
    });

    // IMPORTANT: Only initialize free stock to 0 by default - don't auto-fill quantities
    (freeStock || []).forEach((stock) => {
      if (stock && stock.stock_id) {
        initialFreeStockQty[stock.stock_id] = 0;
      }
    });
    
    // AUTO-FILL: Jika total allocation == quantity needed, langsung set semua allocation
    if (totalAvailable === quantity && allocations.length > 0) {
      setAllocationQty(initialQty);
      setFreeStockQty(initialFreeStockQty); // Keep all at 0 - not needed!
      setUseFreeStock(false); // Tidak perlu free stock
      // Optionally auto-fill date to today
      const today = new Date().toISOString().split("T")[0];
      setPickupDate(today);
    }
    // AUTO-FILL: Jika allocation < quantity tapi allocation + free_stock >= quantity
    else if (totalAvailable < quantity && (totalAvailable + (summary?.total_from_free_stock || 0)) >= quantity) {
      setAllocationQty(initialQty); // Ambil semua allocation
      // Auto-calculate free stock needed
      const freeStockNeeded = quantity - totalAvailable;
      let remaining = freeStockNeeded;
      freeStock.forEach((stock) => {
        if (remaining > 0) {
          const take = Math.min(stock.quantity, remaining);
          initialFreeStockQty[stock.stock_id] = take;
          remaining -= take;
        } else {
          initialFreeStockQty[stock.stock_id] = 0;
        }
      });
      setFreeStockQty(initialFreeStockQty);
      setUseFreeStock(true);
      // Optionally auto-fill date to today
      const today = new Date().toISOString().split("T")[0];
      setPickupDate(today);
    }
    // AUTO-FILL: Jika allocation kosong (0) tapi free stock cukup
    else if (allocations.length === 0 && freeStock.length > 0) {
      // Keep allocation empty
      setAllocationQty(initialQty); // All allocation at 0
      // Auto-calculate free stock needed
      const freeStockNeeded = quantity;
      let remaining = freeStockNeeded;
      freeStock.forEach((stock) => {
        if (remaining > 0) {
          const take = Math.min(stock.quantity, remaining);
          initialFreeStockQty[stock.stock_id] = take;
          remaining -= take;
        } else {
          initialFreeStockQty[stock.stock_id] = 0;
        }
      });
      setFreeStockQty(initialFreeStockQty);
      setUseFreeStock(true);
      // Optionally auto-fill date to today
      const today = new Date().toISOString().split("T")[0];
      setPickupDate(today);
    } else {
      setAllocationQty(initialQty);
      setFreeStockQty(initialFreeStockQty); // All at 0
    }
  }, [allocations, freeStock, quantity, summary]);

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pickupDate || !pickupTime) {
      return;
    }

    // Prepare allocation data for submission
    const allocationData = (allocations || [])
      .filter((alloc) => alloc && alloc.allocation_id && allocationQty[alloc.allocation_id] > 0)
      .map((alloc) => ({
        allocation_id: alloc.allocation_id,
        quantity_picked_up: allocationQty[alloc.allocation_id],
      }));

    // Prepare free stock data for submission
    const freeStockData = (freeStock || [])
      .filter((stock) => stock && stock.stock_id && freeStockQty[stock.stock_id] > 0)
      .map((stock) => ({
        stock_id: stock.stock_id,
        quantity_picked_up: freeStockQty[stock.stock_id],
      }));

    onSubmit({ 
      pickupDate, 
      pickupTime, 
      notes,
      allocations: allocationData,
      free_stock: freeStockData,
    });
  };

  const handleClose = () => {
    if (!loading) {
      setPickupDate("");
      setPickupTime("");
      setNotes("");
      onClose();
    }
  };

  const totalAllocationSelected = Object.values(allocationQty).reduce((a, b) => a + b, 0);
  const totalFreeStockSelected = Object.values(freeStockQty).reduce((a, b) => a + b, 0);
  const totalSelected = totalAllocationSelected + totalFreeStockSelected;
  const canSubmit = totalSelected >= quantity && pickupDate && pickupTime;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Jadwalkan Pickup Darah</h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-blue-900 text-sm font-medium">
                  Darah tersedia dari Allocation dan Free Stock
                </p>
                <p className="text-blue-700 text-xs mt-1">
                  Kedua sumber akan diambil bersamaan untuk melengkapi kebutuhan.
                </p>
              </div>
            </div>
          </div>

        {/* Request Info */}
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Detail Permintaan</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Rumah Sakit</p>
              <p className="text-sm text-gray-800 font-semibold">{hospitalName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Nama Pasien</p>
              <p className="text-sm text-gray-800 font-semibold">{patientName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Golongan Darah</p>
              <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                {bloodType}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Jumlah Dibutuhkan</p>
              <p className="text-sm text-gray-800 font-semibold">{quantity} kantong</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {allocLoading ? (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
              <span>Memuat data allocation & free stock...</span>
            </div>
          ) : allocations.length === 0 && freeStock.length === 0 ? (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
              <p className="text-red-700 text-sm font-semibold">Tidak ada darah tersedia</p>
              <p className="text-red-600 text-xs mt-1">Mohon tunggu hingga donor selesai mendonor</p>
            </div>
          ) : (
            <>
              {/* ALLOCATIONS SECTION */}
              {allocations.length > 0 && (
                <div className="space-y-3 border-b pb-5">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-gray-700" />
                    <h4 className="text-sm font-semibold text-gray-700">Allocation (Darah Tersedia)</h4>
                  </div>
                  
                  {allocations.length > 0 && summary && summary.total_from_allocation === quantity && (
                    <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
                      <p className="text-green-700 text-sm font-semibold">
                        <span className="inline-flex items-center gap-1"><Check size={14} className="text-green-700" /> Allocation sudah cukup</span>
                      </p>
                      <p className="text-green-600 text-xs mt-1">
                        Hanya perlu allocation, tidak memerlukan free stock.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-3 max-h-[250px] overflow-y-auto bg-gray-50 p-3 rounded-lg">
                    {(allocations || []).map((alloc) => (
                      alloc && alloc.allocation_id ? (
                        <div key={alloc.allocation_id} className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{alloc.batch_number}</p>
                            <p className="text-xs text-gray-600 mt-1">Pasien: {alloc.fulfillment_patient || 'N/A'}</p>
                            <p className="text-xs text-gray-600">Kadaluarsa: {alloc.expiry_date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-700">{allocationQty[alloc.allocation_id] || 0}</p>
                            <p className="text-xs text-gray-500">dari {alloc.quantity_pending || alloc.quantity_allocated} kantong</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-green-500 h-full transition-all"
                            style={{
                              width: `${((allocationQty[alloc.allocation_id] || 0) / (alloc.quantity_pending || alloc.quantity_allocated)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}

              {/* FREE STOCK SECTION */}
              {(freeStock || []).length > 0 && totalAllocationSelected < quantity && (
                <div className="space-y-3 border-b pb-5">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-gray-700" />
                    <h4 className="text-sm font-semibold text-gray-700">Free Stock (Stok Tambahan)</h4>
                    <AlertCircle size={16} className="text-amber-500" />
                  </div>
                  
                  {useFreeStock && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg">
                      <p className="text-amber-700 text-sm font-semibold">
                        Free stock akan diambil untuk melengkapi kebutuhan
                      </p>
                      <p className="text-amber-600 text-xs mt-1">
                        Masih dibutuhkan: {quantity - totalAllocationSelected} kantong
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-3 max-h-[250px] overflow-y-auto bg-yellow-50 p-3 rounded-lg">
                    {(freeStock || []).map((stock) => (
                      stock && stock.stock_id ? (
                        <div key={stock.stock_id} className="bg-white p-3 rounded-lg border border-yellow-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{stock.batch_number}</p>
                            <p className="text-xs text-gray-600 mt-1">Kadaluarsa: {stock.expiry_date}</p>
                            <p className="text-xs text-amber-600 font-semibold mt-1">{stock.warning}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-amber-600">{freeStockQty[stock.stock_id] || 0}</p>
                            <p className="text-xs text-gray-500">dari {stock.quantity} kantong</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full transition-all"
                            style={{
                              width: `${((freeStockQty[stock.stock_id] || 0) / stock.quantity) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Section */}
              {summary && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-4 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-blue-600 text-xs">Allocation</p>
                      <p className="font-bold text-blue-900">{totalAllocationSelected}</p>
                    </div>
                    <div>
                      <p className="text-amber-600 text-xs">Free Stock</p>
                      <p className="font-bold text-amber-900">{totalFreeStockSelected}</p>
                    </div>
                    <div>
                      <p className="text-blue-600 text-xs">Total</p>
                      <p className="font-bold text-blue-900">{totalSelected}</p>
                    </div>
                    <div>
                      <p className="text-blue-600 text-xs">Dibutuhkan</p>
                      <p className="font-bold text-blue-900">{quantity}</p>
                    </div>
                  </div>
                  {totalSelected < quantity && (
                    <p className="text-sm text-yellow-700 font-semibold inline-flex items-center gap-1">
                      <AlertCircle size={14} className="text-yellow-700" /> Masih kurang {quantity - totalSelected} kantong
                    </p>
                  )}
                  {totalSelected >= quantity && (
                    <p className="text-sm text-green-700 font-semibold inline-flex items-center gap-1">
                      <Check size={14} className="text-green-700" /> Sudah cukup untuk melengkapi kebutuhan
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Pickup Date */}
          <div className="border-t pt-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tanggal Pickup <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={pickupDate}
                min={today}
                onChange={(e) => setPickupDate(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-white border-2 border-gray-200 rounded-lg px-10 py-3 text-gray-800 focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Pickup Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jam Pickup <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-white border-2 border-gray-200 rounded-lg px-10 py-3 text-gray-800 focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Catatan untuk Rumah Sakit
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={loading}
              placeholder="Contoh: Harap datang tepat waktu, membawa surat pengantar..."
              className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary resize-none transition-colors disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 shadow-md"
            >
              {loading ? "Membuat Jadwal..." : "Buat Jadwal Pickup"}
            </button>
          </div>
        </form>

          {/* Footer Note */}
          <div className="p-6 border-t bg-yellow-50 border-yellow-200">
            <p className="text-xs text-yellow-800">
              <span className="font-semibold">Catatan:</span> Sistem akan menghasilkan kode unik untuk verifikasi saat pengambilan darah.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
