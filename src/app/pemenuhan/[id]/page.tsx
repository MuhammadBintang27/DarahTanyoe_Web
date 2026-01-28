'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import axios from 'axios';

import ProtectedRoute from '@/components/protectedRoute/protectedRoute';
import { useAuth } from '@/context/authContext';
import { useFulfillment, useFulfillmentSubscription } from '@/context/FulfillmentContext';
import FulfillmentProgress from '@/components/FulfillmentProgress';
import DonorList from '@/components/DonorList';

interface EligibleDonor {
  donor_id: string;
  distance_km?: number;
  donation_score?: number;
  blood_type?: string;
  full_name?: string;
  name?: string;
}

export default function FulfillmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const fulfillmentId = params.id as string;

  // Context-based state (old fulfillment flow)
  const {
    currentFulfillment,
    confirmations,
    eligibleDonors,
    loading,
    error,
    getFulfillmentById,
    getConfirmations,
    notifyDonors,
    cancelFulfillment,
  } = useFulfillment();

  // Real-time subscription
  useFulfillmentSubscription(fulfillmentId);

  // New simple state for search + slider
  const [eligibleDonorsFromSearch, setEligibleDonorsFromSearch] = useState<EligibleDonor[]>([]);
  const [searchingDonors, setSearchingDonors] = useState(false);
  const [showDonorSearch, setShowDonorSearch] = useState(false);
  const [selectedDonorCount, setSelectedDonorCount] = useState(1);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedDonors, setSelectedDonors] = useState<string[]>([]);

  useEffect(() => {
    if (fulfillmentId) {
      getFulfillmentById(fulfillmentId);
      getConfirmations(fulfillmentId);
    }
  }, [fulfillmentId, getFulfillmentById, getConfirmations]);

  // Search eligible donors - called when user clicks "Cari Pendonor"
  const handleSearchDonors = async () => {
    try {
      setSearchingDonors(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      const response = await axios.get(
        `${API_BASE_URL}/fulfillment/${fulfillmentId}/search-donors`
      );

      if (response.data.eligible_donors) {
        setEligibleDonorsFromSearch(response.data.eligible_donors);
        setSelectedDonorCount(Math.min(response.data.eligible_donors.length, 1)); // Start with 1 but allow up to max
        setShowDonorSearch(true);
        toast.success(`Ditemukan ${response.data.eligible_donors_count} donor potensial!`);
      }
    } catch (error: any) {
      console.error('Error searching donors:', error);
      toast.error(error.response?.data?.message || 'Gagal mencari donor');
    } finally {
      setSearchingDonors(false);
    }
  };

  // Send notifications to selected count of donors
  const handleSendNotifications = async () => {
    if (!currentFulfillment) return;

    try {
      setSendingNotifications(true);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      const response = await axios.post(
        `${API_BASE_URL}/fulfillment/${currentFulfillment.campaign_id}/send-notifications`,
        {
          campaign_id: currentFulfillment.campaign_id,
          fulfillment_id: fulfillmentId,
          donor_count: selectedDonorCount
        }
      );

      if (response.data) {
        const notifiedCount = response.data.data?.notified_count || selectedDonorCount;
        toast.success(`Notifikasi berhasil dikirim ke ${notifiedCount} donor!`);
        setShowDonorSearch(false);
        setEligibleDonorsFromSearch([]);
        // Reload confirmations to show updated status
        getConfirmations(fulfillmentId);
      }
    } catch (error: any) {
      console.error('Error sending notifications:', error);
      toast.error(error.response?.data?.message || 'Gagal mengirim notifikasi');
    } finally {
      setSendingNotifications(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Masukkan alasan pembatalan');
      return;
    }

    try {
      await cancelFulfillment(fulfillmentId, cancelReason);
      setShowCancelDialog(false);
      toast.success('Pemenuhan berhasil dibatalkan');
      router.push('/pemenuhan');
    } catch (error) {
      toast.error('Gagal membatalkan pemenuhan');
    }
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
    <ProtectedRoute>
      <Toaster position="top-right" />
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/pemenuhan')}
            className="text-white hover:text-gray-100 font-medium mb-4 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
          <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Pemenuhan untuk {currentFulfillment?.patient_name}
                </h1>
                <p className="mt-2 mb-6 text-sm text-white">ID: {currentFulfillment?.id}</p>
              </div>
              <div className="flex gap-3">
                {!showDonorSearch && (
                  <button
                    onClick={handleSearchDonors}
                    disabled={searchingDonors || currentFulfillment?.status === 'fulfilled'}
                    title={currentFulfillment?.status === 'fulfilled' ? 'Pencarian pendonor sudah ditutup (terpenuhi)' : ''}
                    className="bg-teal-500 text-white px-4 py-2 rounded-lg font-medium border-2 border-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {searchingDonors ? '⏳ Mencari...' : currentFulfillment?.status === 'fulfilled' ? '✓ Sudah Terpenuhi' : ' Cari Pendonor'}
                  </button>
                )}
                <button
                  onClick={() => router.push(`/pemenuhan/${fulfillmentId}/verifikasi`)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium border-2 border-white hover:bg-orange-600 transition-colors"
                >
                  Verifikasi Donor
                </button>
                {['initiated', 'donors_found', 'in_progress'].includes(currentFulfillment?.status) && (
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium border-2 border-white hover:bg-blue-700 transition-colors"
                  >
                    Batalkan
                  </button>
                )}
              </div>
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress */}
              {currentFulfillment && <FulfillmentProgress fulfillment={currentFulfillment} confirmations={confirmations} />}

              {/* Donor Search UI */}
              {showDonorSearch && eligibleDonorsFromSearch.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Pilih Jumlah Donor untuk Dikirim Notifikasi
                  </h3>

                  {/* Slider */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Jumlah Donor: <span className="text-2xl font-bold text-red-600">{selectedDonorCount}</span>
                      </label>
                      <span className="text-sm text-gray-500">
                        dari {eligibleDonorsFromSearch.length} donor tersedia
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={eligibleDonorsFromSearch.length}
                      value={selectedDonorCount}
                      onChange={(e) => {
                        const newCount = parseInt(e.target.value);
                        console.log('Slider changed to:', newCount, 'Max:', eligibleDonorsFromSearch.length);
                        setSelectedDonorCount(newCount);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1</span>
                      <span>{eligibleDonorsFromSearch.length}</span>
                    </div>
                  </div>

                  {/* Preview of selected donors */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>Preview {selectedDonorCount} donor terdekat:</strong>
                    </p>
                    <div className="space-y-2">
                      {eligibleDonorsFromSearch.slice(0, selectedDonorCount).map((donor, idx) => {
                        const donorName = donor.full_name || donor.name || `Donor ${donor.donor_id.substring(0, 8)}...`;
                        console.log(`Donor ${idx}:`, donor); // Debug untuk cek structure
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                            <span className="text-sm text-gray-700">
                              {idx + 1}. {donorName}
                            </span>
                            {donor.distance_km !== undefined && donor.distance_km !== null ? (
                              <span className="text-xs text-gray-500">
                                {donor.distance_km.toFixed(1)} km
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Send button */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDonorSearch(false);
                        setEligibleDonorsFromSearch([]);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSendNotifications}
                      disabled={sendingNotifications}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {sendingNotifications ? '⏳ Mengirim...' : `📧 Kirim Notifikasi ke ${selectedDonorCount} Donor`}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirmations - hanya tampilkan yang sudah dikirim notif */}
              {confirmations.filter(c => c.status !== 'pending_notification').length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Konfirmasi Pendonor ({confirmations.filter(c => c.status !== 'pending_notification').length})
                  </h3>
                  <div className="space-y-3">
                    {confirmations.filter(c => c.status !== 'pending_notification').map((confirmation) => (
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
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Permintaan</h3>
                <dl className="space-y-3 text-sm">
                  {currentFulfillment && (
                    <>
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
                    </>
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
    </ProtectedRoute>
  );
}
