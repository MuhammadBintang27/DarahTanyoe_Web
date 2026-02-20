'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFulfillment } from '@/context/FulfillmentContext';
import { useAuth } from '@/context/authContext';
import { CodeVerificationRequest, CompleteDonationRequest } from '@/types/fulfillment';
import toast, { Toaster } from 'react-hot-toast';

export default function VerifikasiPage() {
  const params = useParams();
  const router = useRouter();
  const fulfillmentId = params.id as string;

  const { user } = useAuth();
  const { verifyDonorCode, completeDonation, loading, confirmations, getConfirmations } = useFulfillment();

  const [verifiedDonor, setVerifiedDonor] = useState<any>(null);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const [quickCode, setQuickCode] = useState('');
  const [search, setSearch] = useState('');
  // Modal penyelesaian donasi
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeForm, setCompleteForm] = useState({ quantity: 1, notes: '', medical_notes: '' });
  // Modal verifikasi (meniru konsep Janji Donor)
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [manualCode, setManualCode] = useState('');
  const [codeError, setCodeError] = useState('');
  // Track last processed code to avoid duplicate modal opens
  const [processedCode, setProcessedCode] = useState('');
  useEffect(() => {
    // Otomatis proses saat kode ditempel (tanpa menekan tombol)
    const codeUpper = quickCode.trim().toUpperCase();
    if (!codeUpper) return;
    if (processedCode === codeUpper) return; // hindari pemrosesan berulang

    const conf = confirmations.find((c) => (c.unique_code || '').toUpperCase() === codeUpper);
    if (conf) {
      setProcessedCode(codeUpper);
      handleVerify(codeUpper);
    }
  }, [quickCode, confirmations]);

  useEffect(() => {
    getConfirmations(fulfillmentId);
  }, [fulfillmentId, getConfirmations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return confirmations.filter((c) => {
      const statusOk = c.status !== 'pending';
      const donorName = c.donor?.full_name?.toLowerCase() || '';
      const code = (c.unique_code || '').toLowerCase();
      const match = !q || donorName.includes(q) || code.includes(q);
      return statusOk && match;
    });
  }, [confirmations, search]);

  const handleVerify = async (code: string) => {
    // Jangan langsung memanggil endpoint verifikasi; cari dulu konfirmasi berdasarkan kode
    const normalized = code.trim().toUpperCase();
    const conf = confirmations.find((c) => (c.unique_code || '').toUpperCase() === normalized);

    if (!conf) {
      toast.error('Kode tidak ditemukan pada daftar konfirmasi');
      return;
    }
    setVerifiedDonor({ confirmation: conf });
    setConfirmationId(conf.id);
    const statusStr = String(conf.status);
    if (statusStr.includes('verified')) {
      // Sudah diverifikasi → langsung buka modal penyelesaian donasi
      setCompleteForm({ quantity: 1, notes: '', medical_notes: '' });
      setShowCompleteModal(true);
    } else {
      // Masih confirmed → buka modal verifikasi dengan data pendonor
      setVerifyResult({ confirmation: conf });
      setManualCode('');
      setCodeError('');
      setShowVerifyModal(true);
    }
  };

  const openVerifyModalForDonor = (confirmation: any) => {
    // Buka modal untuk input kode manual dari donor
    setVerifyResult({ confirmation });
    setManualCode('');
    setCodeError('');
    setShowVerifyModal(true);
  };

  const performVerification = async () => {
    try {
      // Validasi kode manual yang diinput
      const inputCode = manualCode.trim().toUpperCase();
      const dbCode = (verifyResult?.confirmation?.unique_code || '').toUpperCase();

      if (!inputCode) {
        setCodeError('Kode unik harus diisi');
        return;
      }

      if (inputCode !== dbCode) {
        setCodeError('Kode tidak cocok dengan data donor. Silakan cek kembali.');
        return;
      }

      if (!user?.id) {
        toast.error('Data tidak lengkap untuk verifikasi');
        return;
      }

      const request: CodeVerificationRequest = {
        unique_code: inputCode,
        pmi_id: user.id,
      };

      console.log('📤 Performing verification for code:', request.unique_code, 'PMI:', user.id);
      const result = await verifyDonorCode(request);

      // Perbarui hasil, kemudian tutup modal dan reload halaman
      setVerifyResult(result);
      setVerifiedDonor(result);
      const confId = result.confirmation?.id || result.confirmation_id;
      setConfirmationId(confId || null);

      toast.success('✅ Kode berhasil diverifikasi!');

      // Tutup modal dan reset input
      setShowVerifyModal(false);
      setVerifyResult(null);
      setManualCode('');
      setCodeError('');
      setQuickCode('');
      setProcessedCode('');

      // Reload data dan refresh route
      await getConfirmations(fulfillmentId);
      router.refresh();
    } catch (error: any) {
      console.error('❌ Verification error:', error);
      toast.error(error.message || 'Verifikasi gagal');
    }
  };

  const handleCompleteDonation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmationId) {
      toast.error('Confirmation ID tidak ditemukan');
      return;
    }

    try {
      if (!user?.id) {
        toast.error('User tidak ditemukan. Silakan login kembali.');
        return;
      }

      const request: CompleteDonationRequest = {
        confirmation_id: confirmationId,
        pmi_id: user.id,
        quantity: completeForm.quantity,
        notes: completeForm.notes,
        medical_notes: completeForm.medical_notes,
        health_screening: {},
      };

      console.log('📤 Sending complete donation request:', request);

      await completeDonation(request);

      toast.success('✅ Donasi berhasil diselesaikan!');
      setShowCompleteModal(false);

      // Reload data dan refresh route (tetap di halaman verifikasi)
      await getConfirmations(fulfillmentId);
      setQuickCode('');
      setProcessedCode('');
      router.refresh();
    } catch (error: any) {
      console.error('❌ Complete donation error:', error);
      toast.error(error.message || 'Gagal menyelesaikan donasi');
    }
  };

  const resetVerification = () => {
    setVerifiedDonor(null);
    setConfirmationId(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/pemenuhan/${fulfillmentId}`)}
          className="text-white hover:text-gray-200 font-medium mb-4 flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Detail Pemenuhan
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Verifikasi Donor</h1>
        <p className="text-white/90">Verifikasi kode unik donor dan selesaikan proses donasi darah</p>
      </div>

      {/* Quick Verification Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          
          <div>
            <h2 className="text-lg font-bold text-gray-900">Verifikasi Cepat</h2>
            <p className="text-sm text-gray-600">Masukkan atau tempel kode unik donor</p>
          </div>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={quickCode}
            onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && quickCode.trim()) {
                handleVerify(quickCode.trim());
              }
            }}
            placeholder="Contoh: DN2602110907"
            className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-wider font-mono text-lg font-semibold"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tempel kode atau tekan Enter untuk memverifikasi
        </p>
      </div>

      {/* Donor List Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Daftar Donor Terkonfirmasi</h2>
            <p className="text-sm text-gray-600">Total {filtered.length} donor</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pendonor atau kode unik..."
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 pl-10 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Donor Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada data</h3>
            <p className="text-gray-600 text-sm">Belum ada donor yang terkonfirmasi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => {
              const status = String(c.status);
              const isConfirmed = status === 'confirmed';
              const isVerified = status.includes('verified');
              const isCompleted = status === 'completed';
              
              const statusConfig = isCompleted 
                ? { label: 'Selesai', color: 'bg-green-50 text-green-700 border-green-200' }
                : isVerified
                ? { label: 'Kode Diverifikasi', color: 'bg-amber-50 text-amber-700 border-amber-200' }
                : isConfirmed
                ? { label: 'Terkonfirmasi', color: 'bg-blue-50 text-blue-700 border-blue-200' }
                : { label: status, color: 'bg-gray-50 text-gray-700 border-gray-200' };

              return (
                <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 mb-1">{c.donor?.full_name || 'Pendonor'}</h3>
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="text-sm font-bold text-primary">{c.donor?.blood_type || '-'}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Kadaluarsa: {c.code_expires_at ? new Date(c.code_expires_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Dibuat: {new Date(c.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-200">
                    {isConfirmed && (
                      <button
                        className="w-full px-3 py-2 rounded-lg text-white text-sm font-medium bg-green-500 hover:bg-green-600 transition-colors"
                        onClick={() => openVerifyModalForDonor(c)}
                      >
                        Verifikasi Kode
                      </button>
                    )}
                    
                    {isVerified && (
                      <button
                        className="w-full px-3 py-2 rounded-lg text-white text-sm font-medium bg-green-500 hover:bg-green-600 transition-colors"
                        onClick={() => {
                          setVerifiedDonor({ confirmation: c });
                          setConfirmationId(c.id);
                          setCompleteForm({ quantity: 1, notes: '', medical_notes: '' });
                          setShowCompleteModal(true);
                        }}
                      >
                        Selesaikan Donasi
                      </button>
                    )}
                    
                    {isCompleted && (
                      <div className="text-center py-2 px-3 rounded-lg bg-gray-100 border border-gray-200">
                        <span className="text-sm font-medium text-gray-600">✓ Donasi Selesai</span>
                      </div>
                    )}
                    
                    {!isConfirmed && !isVerified && !isCompleted && (
                      <div className="text-center py-2 px-3 rounded-lg bg-gray-50 border border-gray-200">
                        <span className="text-sm font-medium text-gray-500">{statusConfig.label}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Selesaikan Donasi */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Selesaikan Donasi</h2>
              <p className="text-sm text-gray-600 mt-1">Lengkapi informasi donasi darah</p>
            </div>

            <form onSubmit={handleCompleteDonation}>
              {/* Content */}
              <div className="px-6 py-5 space-y-4">
                {/* Donor Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Pendonor</span>
                    <span className="text-sm font-bold text-gray-900">{verifiedDonor?.confirmation?.donor?.full_name || verifiedDonor?.donor?.full_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">No. Telepon</span>
                    <span className="text-sm font-semibold text-gray-900">{verifiedDonor?.confirmation?.donor?.phone_number || verifiedDonor?.donor?.phone_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Golongan Darah</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-sm font-bold text-primary">
                      {verifiedDonor?.confirmation?.donor?.blood_type || verifiedDonor?.donor?.blood_type || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Form Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Jumlah Kantong Darah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={completeForm.quantity}
                    onChange={(e) => setCompleteForm({ ...completeForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Contoh: 1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Catatan Medis
                  </label>
                  <textarea
                    rows={3}
                    value={completeForm.medical_notes}
                    onChange={(e) => setCompleteForm({ ...completeForm, medical_notes: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    placeholder="Catatan kondisi kesehatan donor, hasil pemeriksaan..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Catatan Tambahan
                  </label>
                  <textarea
                    rows={2}
                    value={completeForm.notes}
                    onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    placeholder="Catatan lainnya tentang proses donasi..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-gray-700 text-sm font-medium bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !confirmationId}
                  className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium bg-green-500 hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Memproses...' : 'Selesaikan Donasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Verifikasi Kode (hasil verifikasi cepat atau dari daftar) */}
      {showVerifyModal && verifyResult && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Verifikasi Kode Donor</h2>
              <p className="text-sm text-gray-600 mt-1">Masukkan kode unik yang diberikan pendonor</p>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              {/* Donor Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Data Pendonor</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Nama</span>
                    <span className="text-sm font-bold text-gray-900">{verifyResult.confirmation?.donor?.full_name || verifyResult.donor?.full_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">No. Telepon</span>
                    <span className="text-sm font-semibold text-gray-900">{verifyResult.confirmation?.donor?.phone_number || verifyResult.donor?.phone_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Golongan Darah</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-sm font-bold text-primary">
                      {verifyResult.confirmation?.donor?.blood_type || verifyResult.donor?.blood_type || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Code Input */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Kode Unik Donor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => {
                    setManualCode(e.target.value.toUpperCase());
                    setCodeError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualCode.trim()) {
                      performVerification();
                    }
                  }}
                  placeholder="Masukkan kode dari donor"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-wider font-mono text-lg font-semibold"
                  disabled={loading}
                />
                {codeError && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {codeError}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Minta pendonor menunjukkan kode unik dari notifikasi atau SMS
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => { 
                  setShowVerifyModal(false); 
                  setVerifyResult(null); 
                  setManualCode('');
                  setCodeError('');
                }}
                className="flex-1 px-4 py-2.5 rounded-lg text-gray-700 text-sm font-medium bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium bg-green-500 hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={performVerification}
                disabled={loading || !manualCode.trim()}
              >
                {loading ? 'Memverifikasi...' : 'Verifikasi Kode'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
