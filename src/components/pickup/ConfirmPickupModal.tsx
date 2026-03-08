"use client";

import React, { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";

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
  onSubmit: (data: {
    uniqueCode: string;
    sample_verified: boolean;
    sample_test_result: 'compatible' | 'incompatible';
    sample_verification_notes?: string;
  }) => void;
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
  const [sampleVerified, setSampleVerified] = useState(false);
  const [testResult, setTestResult] = useState<'compatible' | 'incompatible'>('compatible');
  const [notes, setNotes] = useState("");
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

    if (!sampleVerified) {
      setError("Verifikasi sample darah pasien wajib dilakukan");
      return;
    }

    setError("");
    onSubmit({
      uniqueCode: code,
      sample_verified: true,
      sample_test_result: testResult,
      sample_verification_notes: notes.trim() || undefined
    });
  };

  const handleClose = () => {
    if (!loading) {
      setUniqueCode("");
      setSampleVerified(false);
      setTestResult('compatible');
      setNotes("");
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
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Konfirmasi Penjemputan</h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Informasi Penjemputan */}
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
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Unique Code Input */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
            <p className="mt-2 text-gray-500 text-xs">
              Minta kode unik dari petugas rumah sakit untuk verifikasi pengambilan darah
            </p>
          </div>

          {/* Sample Verification Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="bg-red-100 text-red-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">!</span>
              Verifikasi Sample Darah Pasien
            </h4>

            {/* Sample Verified Checkbox */}
            <div className="mb-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={sampleVerified}
                  onChange={(e) => setSampleVerified(e.target.checked)}
                  disabled={loading}
                  className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary disabled:opacity-50"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-primary">
                    Sample darah pasien telah diuji dan diverifikasi
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Centang setelah melakukan uji cross-match terhadap sample darah pasien
                  </p>
                </div>
              </label>
            </div>

            {/* Test Result - Only show if sample verified */}
            {sampleVerified && (
              <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Hasil Uji Cross-Match <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      testResult === 'compatible' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="testResult"
                        value="compatible"
                        checked={testResult === 'compatible'}
                        onChange={(e) => setTestResult(e.target.value as 'compatible')}
                        disabled={loading}
                        className="w-4 h-4 text-green-500 border-gray-300 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-green-500" />
                          Compatible - Darah dapat diserahkan
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          Sample compatible, lanjutkan dengan penyerahan darah
                        </p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      testResult === 'incompatible' 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="testResult"
                        value="incompatible"
                        checked={testResult === 'incompatible'}
                        onChange={(e) => setTestResult(e.target.value as 'incompatible')}
                        disabled={loading}
                        className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <X size={16} className="text-red-500" />
                          Incompatible - Tolak permintaan
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          Sample tidak compatible, pickup dibatalkan dan permintaan ditolak
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Lab Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan Laboratorium <span className="text-gray-400">(Opsional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={loading}
                    rows={3}
                    placeholder="Contoh: Golongan darah sesuai, crossmatch negatif, sample dalam kondisi baik"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:bg-gray-100 text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Catatan dari teknisi lab tentang hasil uji sample
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </p>
            </div>
          )}

          {/* Warning */}
          <div className={`border-2 rounded-lg p-3 ${
            testResult === 'incompatible' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <p className={`text-xs flex items-start gap-2 ${
              testResult === 'incompatible' ? 'text-red-800' : 'text-yellow-800'
            }`}>
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                {testResult === 'incompatible' 
                  ? 'PERHATIAN: Penjemputan akan dibatalkan dan permintaan darah akan ditolak. Tindakan ini tidak dapat dibatalkan.'
                  : 'Pastikan sampel telah diuji dan darah telah diserahkan sebelum konfirmasi. Tindakan ini tidak dapat dibatalkan.'}
              </span>
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
              disabled={loading || !uniqueCode || uniqueCode.length !== 8 || !sampleVerified}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium disabled:opacity-50 transition-colors ${
                testResult === 'incompatible'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {loading 
                ? "Memproses..." 
                : testResult === 'incompatible' 
                  ? "Batalkan Penjemputan & Tolak Permintaan" 
                  : "Serahkan Darah & Konfirmasi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
