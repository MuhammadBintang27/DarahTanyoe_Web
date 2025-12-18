"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, Info } from "lucide-react";

interface CreatePickupModalProps {
  isOpen: boolean;
  loading?: boolean;
  requestId: string;
  patientName: string;
  bloodType: string;
  quantity: number;
  hospitalName: string;
  onClose: () => void;
  onSubmit: (data: { pickupDate: string; pickupTime: string; notes?: string }) => void;
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

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pickupDate || !pickupTime) {
      return;
    }

    onSubmit({ pickupDate, pickupTime, notes });
  };

  const handleClose = () => {
    if (!loading) {
      setPickupDate("");
      setPickupTime("");
      setNotes("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Jadwalkan Pickup Darah</h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-blue-900 text-sm font-medium">
                Stok darah akan dikurangi otomatis
              </p>
              <p className="text-blue-700 text-xs mt-1">
                Sistem akan menggunakan metode FIFO (First In First Out) berdasarkan tanggal kadaluarsa
              </p>
            </div>
          </div>
        </div>

        {/* Request Info */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-xl p-4 mb-6">
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
          {/* Pickup Date */}
          <div>
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
          <div className="flex gap-3 pt-2">
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
              disabled={loading || !pickupDate || !pickupTime}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 shadow-md"
            >
              {loading ? "Membuat Jadwal..." : "Buat Jadwal Pickup"}
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <span className="font-semibold">Catatan:</span> Sistem akan menghasilkan kode unik yang akan diberikan kepada Rumah Sakit untuk verifikasi saat pengambilan darah.
          </p>
        </div>
      </div>
    </div>
  );
};
