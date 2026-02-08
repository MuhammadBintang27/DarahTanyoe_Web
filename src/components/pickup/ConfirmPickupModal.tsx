"use client";

import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";

interface ConfirmPickupModalProps {
  isOpen: boolean;
  loading?: boolean;
  scheduleId: string;
  patientName: string;
  bloodType: string;
  quantity: number;
  hospitalName: string;
  prefilledCode?: string;
  onClose: () => void;
  onSubmit: (uniqueCode: string) => void;
}

export const ConfirmPickupModal: React.FC<ConfirmPickupModalProps> = ({
  isOpen,
  loading = false,
  scheduleId,
  patientName,
  bloodType,
  quantity,
  hospitalName,
  prefilledCode = "",
  onClose,
  onSubmit,
}) => {
  const [uniqueCode, setUniqueCode] = useState(prefilledCode);
  const [error, setError] = useState("");

  // Update uniqueCode when prefilledCode changes
  useEffect(() => {
    if (prefilledCode) {
      setUniqueCode(prefilledCode);
    }
  }, [prefilledCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const code = uniqueCode.trim().toUpperCase();
    
    if (!code) {
      setError("Kode unik harus diisi");
      return;
    }

    if (code.length !== 8) {
      setError("Kode unik harus 8 karakter");
      return;
    }

    setError("");
    onSubmit(code);
  };

  const handleClose = () => {
    if (!loading) {
      setUniqueCode("");
      setError("");
      onClose();
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setUniqueCode(value);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Konfirmasi Pickup</h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Pickup Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Rumah Sakit</p>
              <p className="text-sm text-gray-900 font-medium">{hospitalName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Pasien</p>
              <p className="text-sm text-gray-900 font-medium">{patientName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Golongan Darah</p>
              <p className="text-sm text-gray-900 font-medium">{bloodType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Jumlah</p>
              <p className="text-sm text-gray-900 font-medium">{quantity} kantong</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Unique Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kode Unik dari Rumah Sakit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={uniqueCode}
              onChange={handleCodeChange}
              maxLength={8}
              placeholder="Masukkan 8 karakter"
              required
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:bg-gray-100 uppercase tracking-wider text-lg font-mono"
            />
            {error && (
              <p className="mt-2 text-red-500 text-xs flex items-center gap-1">
                <AlertCircle size={12} />
                {error}
              </p>
            )}
            <p className="mt-2 text-gray-500 text-xs">
              Minta kode unik dari petugas rumah sakit untuk verifikasi pengambilan darah
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-xs flex items-start gap-2">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>Pastikan darah telah diserahkan sebelum konfirmasi. Tindakan ini tidak dapat dibatalkan.</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !uniqueCode || uniqueCode.length !== 8}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? "Memverifikasi..." : "Konfirmasi Pickup"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
