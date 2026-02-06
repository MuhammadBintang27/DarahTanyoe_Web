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
  const [selectedDonorCount, setSelectedDonorCount] = useState(0); // Start from 0
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number | null>(null); // Filter radius
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
        setSelectedDonorCount(0); // Start from 0
        setSelectedRadiusKm(null); // Reset radius filter
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

  // Filter donors by radius
  const filteredDonorsByRadius = selectedRadiusKm
    ? eligibleDonorsFromSearch.filter(
        (donor) => donor.distance_km !== undefined && donor.distance_km <= selectedRadiusKm
      )
    : eligibleDonorsFromSearch;

  // Maximum donors available after radius filter
  const maxAvailableDonors = filteredDonorsByRadius.length;

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
        setSelectedRadiusKm(null);
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
      <style jsx>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
        }

        input[type="range"]::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
        }

        input[type="range"]::-moz-range-track {
          height: 8px;
          border-radius: 4px;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          margin-top: -6px;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }

        input[type="range"]:disabled::-webkit-slider-thumb {
          background: #9ca3af;
          cursor: not-allowed;
        }

        input[type="range"]:disabled::-moz-range-thumb {
          background: #9ca3af;
          cursor: not-allowed;
        }

        input[type="range"]:hover::-webkit-slider-thumb {
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.5);
        }

        input[type="range"]:hover::-moz-range-thumb {
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.5);
        }
      `}</style>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/pemenuhan')}
            className="text-white hover:text-gray-200 font-medium mb-4 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {currentFulfillment?.patient_name}
              </h1>
              <p className="mt-2 text-lg text-white font-semibold mb-6">Pemenuhan Permintaan Darah</p>
            </div>
            <div className="flex gap-2">
              {!showDonorSearch && (
                <button
                  onClick={handleSearchDonors}
                  disabled={
                    searchingDonors ||
                    currentFulfillment?.status === 'fulfilled'
                  }
                  title={
                    currentFulfillment?.status === 'fulfilled' 
                      ? 'Pencarian pendonor sudah ditutup (terpenuhi)'
                      : ''
                  }
                  className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-blue-200"
                >
                  {searchingDonors
                    ? 'Mencari...'
                    : currentFulfillment?.status === 'fulfilled' 
                      ? 'Sudah Terpenuhi'
                      : 'Cari Pendonor'}
                </button>
              )}
              <button
                onClick={() => router.push(`/pemenuhan/${fulfillmentId}/verifikasi`)}
                className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-100 transition-colors border border-green-200"
              >
                Verifikasi Donor
              </button>
              {['initiated', 'donors_found', 'in_progress'].includes(currentFulfillment?.status) && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="bg-red-50 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors border border-red-200"
                >
                  Batalkan
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress */}
            {currentFulfillment && <FulfillmentProgress fulfillment={currentFulfillment} confirmations={confirmations} />}

            {/* Donor Search UI */}
            {showDonorSearch && eligibleDonorsFromSearch.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Pilih Jumlah Donor
                </h3>

                {/* Radius Filter Dropdown */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Filter Radius Pencarian
                  </label>
                  <select
                    value={selectedRadiusKm || ''}
                    onChange={(e) => {
                      const newRadius = e.target.value ? Number(e.target.value) : null;
                      setSelectedRadiusKm(newRadius);
                      
                      // Auto-adjust donor count if it exceeds filtered results
                      const filteredCount = newRadius
                        ? eligibleDonorsFromSearch.filter(d => d.distance_km && d.distance_km <= newRadius).length
                        : eligibleDonorsFromSearch.length;
                      
                      if (selectedDonorCount > filteredCount) {
                        setSelectedDonorCount(filteredCount);
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-medium"
                  >
                    <option value="">Semua Jarak (Total: {eligibleDonorsFromSearch.length} donor)</option>
                    <option value="5">Dalam radius 5 km</option>
                    <option value="10">Dalam radius 10 km</option>
                    <option value="15">Dalam radius 15 km</option>
                    <option value="20">Dalam radius 20 km</option>
                    <option value="30">Dalam radius 30 km</option>
                    <option value="50">Dalam radius 50 km</option>
                  </select>
                  {selectedRadiusKm && (
                    <p className="text-sm text-blue-600 mt-2 font-medium">
                      ✓ Ditemukan {maxAvailableDonors} donor dalam radius {selectedRadiusKm} km
                    </p>
                  )}
                </div>

                {/* Slider */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Jumlah Donor
                      </label>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{selectedDonorCount}</p>
                    </div>
                    <span className="text-sm text-gray-500">
                      dari {maxAvailableDonors} tersedia
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={maxAvailableDonors}
                    value={Math.min(selectedDonorCount, maxAvailableDonors)}
                    onChange={(e) => {
                      const newCount = parseInt(e.target.value);
                      setSelectedDonorCount(newCount);
                    }}
                    disabled={maxAvailableDonors === 0}
                    className="w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: maxAvailableDonors === 0 
                        ? '#e5e7eb' 
                        : `linear-gradient(to right, #2563eb 0%, #2563eb ${(Math.min(selectedDonorCount, maxAvailableDonors) / maxAvailableDonors) * 100}%, #e5e7eb ${(Math.min(selectedDonorCount, maxAvailableDonors) / maxAvailableDonors) * 100}%, #e5e7eb 100%)`,
                      height: '8px',
                      borderRadius: '4px'
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0</span>
                    <span>{maxAvailableDonors}</span>
                  </div>
                </div>

                {/* Preview of selected donors */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    {selectedDonorCount} Donor Terdekat {selectedRadiusKm ? `(≤ ${selectedRadiusKm} km)` : ''}
                  </p>
                  {maxAvailableDonors === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                      <p className="text-sm text-yellow-700 font-medium">
                        Tidak ada donor dalam radius {selectedRadiusKm} km
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Coba pilih radius yang lebih besar
                      </p>
                    </div>
                  ) : selectedDonorCount === 0 ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <p className="text-sm text-gray-600">
                        Geser slider untuk memilih jumlah donor
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredDonorsByRadius.slice(0, selectedDonorCount).map((donor, idx) => {
                        const donorName = donor.full_name || donor.name || `Donor ${donor.donor_id.substring(0, 8)}...`;
                        return (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-sm font-medium text-gray-900">
                              {idx + 1}. {donorName}
                            </span>
                            {donor.distance_km !== undefined && donor.distance_km !== null ? (
                              <span className="text-xs text-gray-600 font-medium">
                                {donor.distance_km.toFixed(1)} km
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Send button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDonorSearch(false);
                      setEligibleDonorsFromSearch([]);
                      setSelectedRadiusKm(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSendNotifications}
                    disabled={sendingNotifications || maxAvailableDonors === 0 || selectedDonorCount === 0}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {sendingNotifications ? 'Mengirim...' : selectedDonorCount === 0 ? 'Pilih Minimal 1 Donor' : `Kirim ke ${selectedDonorCount} Donor`}
                  </button>
                </div>
              </div>
            )}

            {/* Confirmations - hanya tampilkan yang sudah dikirim notif */}
            {confirmations.filter(c => c.status !== 'pending_notification').length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Konfirmasi Pendonor ({confirmations.filter(c => c.status !== 'pending_notification').length})
                </h3>
                <div className="space-y-3">
                  {confirmations.filter(c => c.status !== 'pending_notification').map((confirmation) => (
                    <div
                      key={confirmation.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {confirmation.donor?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{confirmation.unique_code}</p>
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            {confirmation.code_verified && (
                              <span className="text-green-600 font-medium">✓ Terverifikasi</span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                            confirmation.status === 'completed'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : confirmation.status === 'confirmed'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : confirmation.status === 'pending'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
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
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Detail Permintaan</h3>
              <dl className="space-y-4 text-sm">
                {currentFulfillment && (
                  <>
                    <div>
                      <dt className="text-xs font-medium text-gray-600 mb-1">Pasien</dt>
                      <dd className="font-semibold text-gray-900">{currentFulfillment.patient_name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-600 mb-1">Golongan Darah</dt>
                      <dd className="font-semibold text-gray-900">{currentFulfillment.blood_type}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-600 mb-1">Jumlah Dibutuhkan</dt>
                      <dd className="font-semibold text-gray-900">
                        {currentFulfillment.quantity_needed} kantong
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-600 mb-1">Radius Pencarian</dt>
                      <dd className="font-semibold text-gray-900">
                        {currentFulfillment.search_radius_km} km
                      </dd>
                    </div>
                    {currentFulfillment.notes && (
                      <div>
                        <dt className="text-xs font-medium text-gray-600 mb-1">Catatan</dt>
                        <dd className="font-semibold text-gray-900">{currentFulfillment.notes}</dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
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
