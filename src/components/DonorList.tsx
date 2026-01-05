import React from 'react';
import { EligibleDonor } from '@/types/fulfillment';

interface DonorListProps {
  donors: EligibleDonor[];
  selectedDonors: string[];
  onToggleSelect: (donorId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  loading?: boolean;
}

export default function DonorList({
  donors,
  selectedDonors,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  loading = false,
}: DonorListProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (donors.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada pendonor ditemukan</h3>
        <p className="mt-1 text-sm text-gray-500">
          Coba ubah kriteria pencarian atau perluas radius pencarian.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Select All Controls */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
        <span className="text-sm font-medium text-gray-700">
          {selectedDonors.length} dari {donors.length} pendonor dipilih
        </span>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Pilih Semua
          </button>
          {selectedDonors.length > 0 && (
            <>
              <span className="text-gray-300">|</span>
              <button
                onClick={onDeselectAll}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                Batal Semua
              </button>
            </>
          )}
        </div>
      </div>

      {/* Donor List */}
      <div className="space-y-2">
        {donors.map((donor) => {
          const isSelected = selectedDonors.includes(donor.donor_id);

          return (
            <div
              key={donor.donor_id}
              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => onToggleSelect(donor.donor_id)}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(donor.donor_id)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                {/* Donor Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">
                        {donor.full_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {donor.phone_number} • {donor.age} tahun
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {donor.priority_flag && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                          Prioritas
                        </span>
                      )}
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold text-sm">
                          {donor.blood_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="text-center">
                      <p className={`text-lg font-bold ${getScoreColor(donor.final_score)}`}>
                        {donor.final_score}
                      </p>
                      <p className="text-xs text-gray-500">Skor Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">
                        {donor.distance_km.toFixed(1)} km
                      </p>
                      <p className="text-xs text-gray-500">Jarak</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {donor.total_donations}x
                      </p>
                      <p className="text-xs text-gray-500">Donasi</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">
                        {donor.completion_rate?.toFixed(0) || 0}%
                      </p>
                      <p className="text-xs text-gray-500">Komitmen</p>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>Jarak: {donor.distance_score}</span>
                    <span>Riwayat: {donor.history_score}</span>
                    <span>Komitmen: {donor.commitment_score}</span>
                    <span>Rank: #{donor.recommendation_rank}</span>
                  </div>

                  {/* Last Donation */}
                  {donor.last_donation_date && (
                    <p className="text-xs text-gray-500 mt-2">
                      Donasi terakhir:{' '}
                      {new Date(donor.last_donation_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
