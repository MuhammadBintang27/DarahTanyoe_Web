'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFulfillment, useFulfillmentSubscription } from '@/context/FulfillmentContext';
import FulfillmentProgress from '@/components/FulfillmentProgress';
import DonorList from '@/components/DonorList';

export default function FulfillmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fulfillmentId = params.id as string;

  const {
    currentFulfillment,
    confirmations,
    eligibleDonors,
    loading,
    error,
    getFulfillmentById,
    getConfirmations,
    searchEligibleDonors,
    notifyDonors,
    initiateFulfillment,
    cancelFulfillment,
  } = useFulfillment();

  // Real-time subscription
  useFulfillmentSubscription(fulfillmentId);

  const [selectedDonors, setSelectedDonors] = useState<string[]>([]);
  const [showDonorSearch, setShowDonorSearch] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (fulfillmentId) {
      getFulfillmentById(fulfillmentId);
      getConfirmations(fulfillmentId);
    }
  }, [fulfillmentId]);

  const handleSearchDonors = async () => {
    setShowDonorSearch(true);
    await searchEligibleDonors(fulfillmentId);
  };

  const handleInitiate = async () => {
    if (confirm('Mulai proses pemenuhan dan cari pendonor?')) {
      await initiateFulfillment(fulfillmentId);
      setShowDonorSearch(true);
    }
  };

  const handleNotifyDonors = async () => {
    if (selectedDonors.length === 0) {
      alert('Pilih minimal 1 pendonor');
      return;
    }

    if (confirm(`Kirim notifikasi ke ${selectedDonors.length} pendonor?`)) {
      await notifyDonors(fulfillmentId, selectedDonors);
      setSelectedDonors([]);
      setShowDonorSearch(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Masukkan alasan pembatalan');
      return;
    }

    await cancelFulfillment(fulfillmentId, cancelReason);
    setShowCancelDialog(false);
  };

  const toggleDonorSelect = (donorId: string) => {
    setSelectedDonors((prev) =>
      prev.includes(donorId) ? prev.filter((id) => id !== donorId) : [...prev, donorId]
    );
  };

  const selectAllDonors = () => {
    setSelectedDonors(eligibleDonors.map((d) => d.donor_id));
  };

  const deselectAllDonors = () => {
    setSelectedDonors([]);
  };

  if (loading && !currentFulfillment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !currentFulfillment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/pemenuhan')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Kembali ke Daftar
          </button>
        </div>
      </div>
    );
  }

  if (!currentFulfillment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/pemenuhan')}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Pemenuhan untuk {currentFulfillment.patient_name}
              </h1>
              <p className="mt-2 text-sm text-gray-600">ID: {currentFulfillment.id}</p>
            </div>
            <div className="flex gap-2">
              {currentFulfillment.status === 'initiated' && (
                <button
                  onClick={handleInitiate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  Mulai Proses
                </button>
              )}
              {currentFulfillment.status === 'donors_found' && (
                <button
                  onClick={handleSearchDonors}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
                >
                  Lihat Pendonor
                </button>
              )}
              {['initiated', 'donors_found', 'in_progress'].includes(currentFulfillment.status) && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
                >
                  Batalkan
                </button>
              )}
              <button
                onClick={() => router.push(`/pemenuhan/${fulfillmentId}/verifikasi`)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700"
              >
                Verifikasi Donor
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress */}
            <FulfillmentProgress fulfillment={currentFulfillment} confirmations={confirmations} />

            {/* Donor Search Results */}
            {showDonorSearch && eligibleDonors.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pendonor Eligible ({eligibleDonors.length})
                  </h3>
                  <button
                    onClick={handleNotifyDonors}
                    disabled={selectedDonors.length === 0 || loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Kirim Notifikasi ({selectedDonors.length})
                  </button>
                </div>
                <DonorList
                  donors={eligibleDonors}
                  selectedDonors={selectedDonors}
                  onToggleSelect={toggleDonorSelect}
                  onSelectAll={selectAllDonors}
                  onDeselectAll={deselectAllDonors}
                  loading={loading}
                />
              </div>
            )}

            {/* Confirmations */}
            {confirmations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Konfirmasi Pendonor ({confirmations.length})
                </h3>
                <div className="space-y-3">
                  {confirmations.map((confirmation) => (
                    <div
                      key={confirmation.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {confirmation.donor?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600">{confirmation.unique_code}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <span>Status: {confirmation.status}</span>
                            {confirmation.code_verified && (
                              <span className="text-green-600">✓ Terverifikasi</span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            confirmation.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : confirmation.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : confirmation.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {confirmation.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Permintaan</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Pasien</dt>
                  <dd className="font-medium text-gray-900">{currentFulfillment.patient_name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Golongan Darah</dt>
                  <dd className="font-medium text-gray-900">{currentFulfillment.blood_type}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Jumlah Dibutuhkan</dt>
                  <dd className="font-medium text-gray-900">
                    {currentFulfillment.quantity_needed} kantong
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Urgensi</dt>
                  <dd className="font-medium text-gray-900">{currentFulfillment.urgency_level}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Radius Pencarian</dt>
                  <dd className="font-medium text-gray-900">
                    {currentFulfillment.search_radius_km} km
                  </dd>
                </div>
                {currentFulfillment.notes && (
                  <div>
                    <dt className="text-gray-500">Catatan</dt>
                    <dd className="font-medium text-gray-900">{currentFulfillment.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Batalkan Pemenuhan</h3>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Masukkan alasan pembatalan..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Batalkan Pemenuhan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
