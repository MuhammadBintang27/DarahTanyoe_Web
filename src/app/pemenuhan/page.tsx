'use client';

import React, { useEffect, useState } from 'react';
import { useFulfillment } from '@/context/FulfillmentContext';
import FulfillmentCard from '@/components/FulfillmentCard';
import { useRouter } from 'next/navigation';
import { FulfillmentFilters } from '@/types/fulfillment';
import { useAuth } from '@/context/authContext';

export default function PemenuhanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { fulfillments, loading, error, fetchFulfillments } = useFulfillment();
  const [filters, setFilters] = useState<FulfillmentFilters>({});

  useEffect(() => {
    // Add pmi_id to filters if user is PMI
    const filtersWithUser = { ...filters };
    if (user?.id && user?.institution_type === 'pmi') {
      filtersWithUser.pmi_id = user.id;
    }
    fetchFulfillments(filtersWithUser);
  }, [filters, user?.id, user?.institution_type, fetchFulfillments]);

  const handleFilterChange = (key: keyof FulfillmentFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pemenuhan Permintaan Darah</h1>
              <p className="mt-2 text-sm text-gray-600">
                Kelola proses pemenuhan permintaan darah melalui kampanye donor
              </p>
            </div>
            <button
              onClick={() => router.push('/pemenuhan/create')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              + Buat Pemenuhan Baru
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Status</option>
                <option value="initiated">Diinisiasi</option>
                <option value="searching_donors">Mencari Pendonor</option>
                <option value="donors_found">Pendonor Ditemukan</option>
                <option value="in_progress">Dalam Proses</option>
                <option value="partially_fulfilled">Sebagian Terpenuhi</option>
                <option value="fulfilled">Terpenuhi</option>
                <option value="failed">Gagal</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Golongan Darah
              </label>
              <select
                value={filters.blood_type || ''}
                onChange={(e) => handleFilterChange('blood_type', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Golongan</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgensi
              </label>
              <select
                value={filters.urgency_level || ''}
                onChange={(e) => handleFilterChange('urgency_level', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Urgensi</option>
                <option value="critical">Kritis</option>
                <option value="high">Tinggi</option>
                <option value="medium">Sedang</option>
                <option value="low">Rendah</option>
              </select>
            </div>

            {(filters.status || filters.blood_type || filters.urgency_level) && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && (!fulfillments || fulfillments.length === 0) && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Tidak ada pemenuhan permintaan
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Mulai dengan membuat pemenuhan permintaan baru
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/pemenuhan/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                + Buat Pemenuhan Baru
              </button>
            </div>
          </div>
        )}

        {/* Fulfillment List */}
        {!loading && fulfillments && fulfillments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fulfillments.map((fulfillment) => (
              <FulfillmentCard
                key={fulfillment.id}
                fulfillment={fulfillment}
                onClick={() => router.push(`/pemenuhan/${fulfillment.id}`)}
              />
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && fulfillments && fulfillments.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{fulfillments.length}</p>
                <p className="text-sm text-gray-600">Total Pemenuhan</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {fulfillments.filter((f) => f.status === 'fulfilled').length}
                </p>
                <p className="text-sm text-gray-600">Terpenuhi</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {fulfillments.filter((f) => f.status === 'in_progress').length}
                </p>
                <p className="text-sm text-gray-600">Dalam Proses</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {fulfillments.filter((f) => f.status === 'donors_found').length}
                </p>
                <p className="text-sm text-gray-600">Pendonor Ditemukan</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
