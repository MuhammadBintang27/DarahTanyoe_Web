'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFulfillment } from '@/context/FulfillmentContext';
import { useAuth } from '@/context/authContext';
import CodeVerificationForm from '@/components/CodeVerificationForm';
import { CodeVerificationRequest, CompleteDonationRequest } from '@/types/fulfillment';
import toast, { Toaster } from 'react-hot-toast';

export default function VerifikasiPage() {
  const params = useParams();
  const router = useRouter();
  const fulfillmentId = params.id as string;

  const { user } = useAuth();
  const { verifyDonorCode, completeDonation, loading } = useFulfillment();

  const [verifiedDonor, setVerifiedDonor] = useState<any>(null);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const [donationForm, setDonationForm] = useState({
    quantity: 1,
    notes: '',
    medical_notes: '',
  });

  const handleVerify = async (code: string) => {
    try {
      if (!user?.id) {
        throw new Error('User tidak ditemukan. Silakan login kembali.');
      }

      const request: CodeVerificationRequest = {
        unique_code: code,
        pmi_id: user.id, // PMI ID dari user yang login
      };

      console.log('📤 Verifying code:', code, 'for PMI:', user.id);

      const result = await verifyDonorCode(request);
      
      console.log('✅ Verification result:', result);
      console.log('📋 Result structure:', {
        hasConfirmation: !!result.confirmation,
        confirmationId: result.confirmation?.id,
        hasDonor: !!result.confirmation?.donor,
        donorName: result.confirmation?.donor?.full_name
      });
      
      setVerifiedDonor(result);
      
      // Get confirmation ID from the confirmation object
      const confId = result.confirmation?.id || result.confirmation_id;
      setConfirmationId(confId);
      
      console.log('✅ Confirmation ID set to:', confId);
      
      if (!confId) {
        toast.error('⚠️ Confirmation ID tidak ditemukan dalam response');
        console.error('❌ Full result object:', result);
      } else {
        toast.success('✅ Kode berhasil diverifikasi!');
      }
    } catch (error: any) {
      console.error('❌ Verification error:', error);
      toast.error(error.message || 'Verifikasi gagal');
      throw new Error(error.message || 'Verifikasi gagal');
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
        quantity: donationForm.quantity,
        notes: donationForm.notes,
        medical_notes: donationForm.medical_notes,
        health_screening: {},
      };

      console.log('📤 Sending complete donation request:', request);

      await completeDonation(request);

      toast.success('✅ Donasi berhasil diselesaikan!');
      
      // Wait a bit before redirect
      setTimeout(() => {
        router.push(`/pemenuhan/${fulfillmentId}`);
      }, 1500);
    } catch (error: any) {
      console.error('❌ Complete donation error:', error);
      toast.error(error.message || 'Gagal menyelesaikan donasi');
    }
  };

  const resetVerification = () => {
    setVerifiedDonor(null);
    setConfirmationId(null);
    setDonationForm({ quantity: 1, notes: '', medical_notes: '' });
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
          <p className="mt-2 text-lg text-white font-semibold mb-6">
            Verifikasi kode donor dan proses donasi darah
          </p>
        </div>

        {!verifiedDonor ? (
          /* Verification Form */
          <CodeVerificationForm onVerify={handleVerify} loading={loading} />
        ) : (
          /* Donor Details & Completion Form */
          <div className="space-y-6">
            {/* Verified Donor Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center border border-green-200">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Kode Terverifikasi</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Nama Pendonor</p>
                  <p className="font-semibold text-gray-900">
                    {verifiedDonor.confirmation?.donor?.full_name || verifiedDonor.donor?.full_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Nomor Telepon</p>
                  <p className="font-semibold text-gray-900">
                    {verifiedDonor.confirmation?.donor?.phone_number || verifiedDonor.donor?.phone_number || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Golongan Darah</p>
                  <p className="font-semibold text-gray-900">
                    {verifiedDonor.confirmation?.donor?.blood_type || verifiedDonor.donor?.blood_type || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Kode Unik</p>
                  <p className="font-semibold text-gray-900 font-mono">
                    {verifiedDonor.confirmation?.unique_code || verifiedDonor.unique_code || 'N/A'}
                  </p>
                </div>
              </div>
              
              
              <button
                onClick={resetVerification}
                className="mt-5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Verifikasi Kode Lain
              </button>
            </div>

            {/* Donation Completion Form */}
            <form onSubmit={handleCompleteDonation} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-5">
                Proses Donasi
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Kantong Darah
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={donationForm.quantity}
                    onChange={(e) =>
                      setDonationForm({ ...donationForm, quantity: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan Medis
                  </label>
                  <textarea
                    value={donationForm.medical_notes}
                    onChange={(e) =>
                      setDonationForm({ ...donationForm, medical_notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Catatan pemeriksaan kesehatan, vital signs, dll..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan Tambahan
                  </label>
                  <textarea
                    value={donationForm.notes}
                    onChange={(e) =>
                      setDonationForm({ ...donationForm, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Catatan tambahan tentang proses donasi..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetVerification}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !confirmationId}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  onClick={(e) => {
                    if (!confirmationId) {
                      e.preventDefault();
                      toast.error('Confirmation ID tidak ditemukan. Silakan verifikasi ulang.');
                      console.error('❌ Confirmation ID is missing:', confirmationId);
                      console.error('❌ Verified Donor:', verifiedDonor);
                    }
                  }}
                >
                  {loading ? 'Memproses...' : 'Selesaikan Donasi'}
                </button>
              </div>
              
             
            </form>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Petunjuk:</h4>
              <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside">
                <li>Pastikan pendonor dalam kondisi sehat dan memenuhi syarat donor</li>
                <li>Lakukan pemeriksaan kesehatan dan vital signs</li>
                <li>Catat hasil pemeriksaan di form catatan medis</li>
                <li>Proses pengambilan darah sesuai prosedur standar</li>
                <li>Klik "Selesaikan Donasi" setelah proses selesai</li>
              </ol>
            </div>
          </div>
        )}
    </div>
  );
}
