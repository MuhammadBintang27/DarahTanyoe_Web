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
      setShowVerifyModal(true);
    }
  };

  const performVerification = async () => {
    try {
      if (!user?.id || !verifyResult?.confirmation?.unique_code) {
        toast.error('Data tidak lengkap untuk verifikasi');
        return;
      }

      const request: CodeVerificationRequest = {
        unique_code: String(verifyResult.confirmation.unique_code),
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
    <div className="p-6">
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
          Kembali
        </button>
        <h1 className="text-3xl font-bold text-white">Verifikasi Donor</h1>
        <p className="mt-2 text-lg text-white font-semibold mb-6">Verifikasi kode donor dan proses donasi darah</p>
      </div>

      {/* Form verifikasi selalu tampil */}
      

      


      {/* Verifikasi Cepat (tanpa tombol, paste/Enter langsung proses) */}
      <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200 mb-6">
        <label className="block text-sm font-bold text-gray-900 mb-3">Verifikasi Cepat</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={quickCode}
            onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && quickCode.trim()) {
                handleVerify(quickCode.trim());
              }
            }}
            placeholder="Masukkan kode unik (contoh: DN2602110907)"
            className="flex-1 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors uppercase tracking-wider font-mono text-lg font-bold"
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">Tempel kode atau tekan Enter untuk verifikasi</p>
      </div>

      {/* Daftar konfirmasi (kecuali pending) selalu tampil */}
      <div className="mt-6 space-y-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pendonor atau kode..."
              className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center text-gray-600 text-sm py-6">Tidak ada data</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((c) => (
                <div key={c.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">{c.donor?.full_name || 'Pendonor'}</p>
                        <span className="px-2 py-0.5 rounded text-xs border bg-gray-50 text-gray-700">
                          {(() => {
                            const s = String(c.status);
                            if (s === 'confirmed') return 'Terkonfirmasi';
                            if (s.includes('verified')) return 'Kode Diverifikasi';
                            if (s === 'completed') return 'Selesai';
                            if (s === 'pending') return 'Menunggu';
                            return s;
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Golongan Darah: <span className="font-medium">{c.donor?.blood_type || '-'}</span></p>
                    </div>
                    <div className="px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="text-xs text-primary font-semibold">{c.donor?.blood_type || '-'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Kadaluarsa</p>
                      <p className="text-xs text-gray-900">{c.code_expires_at ? new Date(c.code_expires_at).toLocaleString() : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Dibuat</p>
                      <p className="text-xs text-gray-900">{new Date(c.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <p className="text-xs text-gray-900">{c.status}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {String(c.status) === 'confirmed' && (
                      <button
                        className="px-3 py-1.5 rounded text-white text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          if (c.unique_code) {
                            handleVerify(c.unique_code);
                          } else {
                            toast.error('Kode unik tidak tersedia');
                          }
                        }}
                      >Verifikasi Kode</button>
                    )}
                    {String(c.status).includes('verified') && (
                      <button
                        className="px-3 py-1.5 rounded text-white text-xs bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => {
                          setVerifiedDonor({ confirmation: c });
                          setConfirmationId(c.id);
                          setCompleteForm({ quantity: 1, notes: '', medical_notes: '' });
                          setShowCompleteModal(true);
                        }}
                      >Selesaikan Donasi</button>
                    )}
                    {String(c.status) === 'completed' && (
                      <span className="px-3 py-1.5 rounded text-xs bg-gray-100 text-gray-600 border">Selesai</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Selesaikan Donasi */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200">
            <div className="p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Selesaikan Donasi</h3>
              <p className="text-xs text-gray-600 mt-1">Jumlah kantong default 1</p>
            </div>
            <form onSubmit={handleCompleteDonation}>
              <div className="p-4 space-y-4">
                {/* Detail Pendonor sebelum penyelesaian */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Data Pendonor</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Nama</p>
                      <p className="text-sm font-semibold text-gray-900">{verifiedDonor?.confirmation?.donor?.full_name || verifiedDonor?.donor?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Nomor Telepon</p>
                      <p className="text-sm font-semibold text-gray-900">{verifiedDonor?.confirmation?.donor?.phone_number || verifiedDonor?.donor?.phone_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Golongan Darah</p>
                      <p className="text-sm font-semibold text-gray-900">{verifiedDonor?.confirmation?.donor?.blood_type || verifiedDonor?.donor?.blood_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Status Konfirmasi</p>
                      <p className="text-sm font-semibold text-gray-900">{String(verifiedDonor?.confirmation?.status || verifiedDonor?.status || '-')}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Kantong Darah</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={completeForm.quantity}
                    onChange={(e) => setCompleteForm({ ...completeForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Medis</label>
                  <textarea
                    rows={3}
                    value={completeForm.medical_notes}
                    onChange={(e) => setCompleteForm({ ...completeForm, medical_notes: e.target.value })}
                    placeholder="Catatan pemeriksaan kesehatan, vital signs, dll..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Tambahan</label>
                  <textarea
                    rows={3}
                    value={completeForm.notes}
                    onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
                    placeholder="Catatan tambahan tentang proses donasi..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="p-4 flex gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >Batal</button>
                <button
                  type="submit"
                  disabled={loading || !confirmationId}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >{loading ? 'Memproses...' : 'Selesaikan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Verifikasi Kode (hasil verifikasi cepat atau dari daftar) */}
      {showVerifyModal && verifyResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200">
            <div className="p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Verifikasi Berhasil</h3>
              <p className="text-xs text-gray-600 mt-1">Detail pendonor</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Nama Pendonor</p>
                  <p className="font-semibold text-gray-900">{verifyResult.confirmation?.donor?.full_name || verifyResult.donor?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Nomor Telepon</p>
                  <p className="font-semibold text-gray-900">{verifyResult.confirmation?.donor?.phone_number || verifyResult.donor?.phone_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Golongan Darah</p>
                  <p className="font-semibold text-gray-900">{verifyResult.confirmation?.donor?.blood_type || verifyResult.donor?.blood_type || 'N/A'}</p>
                </div>
                {/* Kode unik disembunyikan untuk tampilan PMI */}
              </div>
            </div>
            <div className="p-4 flex gap-3 border-t">
              <button
                type="button"
                onClick={() => { setShowVerifyModal(false); setVerifyResult(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >Tutup</button>
              {String(verifyResult.confirmation?.status) === 'confirmed' ? (
                <button
                  type="button"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                  onClick={performVerification}
                >Verifikasi Kode</button>
              ) : (
                <button
                  type="button"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                  onClick={() => {
                    const confId = verifyResult.confirmation?.id || verifyResult.confirmation_id || confirmationId;
                    setConfirmationId(confId || null);
                    setCompleteForm({ quantity: 1, notes: '', medical_notes: '' });
                    setShowVerifyModal(false);
                    setShowCompleteModal(true);
                  }}
                >Selesaikan Donasi</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
