import React from 'react';
import { FulfillmentRequest } from '@/types/fulfillment';
import { useFulfillmentStats } from '@/hooks/useFulfillmentStats';

interface FulfillmentProgressProps {
  fulfillment: FulfillmentRequest;
  confirmations?: any[];
  className?: string;
}

export default function FulfillmentProgress({
  fulfillment,
  confirmations = [],
  className = '',
}: FulfillmentProgressProps) {
  const stats = useFulfillmentStats(fulfillment, confirmations);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'donors_found':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'initiated':
        return 'Diinisiasi';
      case 'searching_donors':
        return 'Mencari Pendonor';
      case 'donors_found':
        return 'Pendonor Ditemukan';
      case 'in_progress':
        return 'Dalam Proses';
      case 'partially_fulfilled':
        return 'Sebagian Terpenuhi';
      case 'fulfilled':
        return 'Terpenuhi';
      case 'failed':
        return 'Gagal';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 ${className}`}>
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Progress Pemenuhan</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
            fulfillment.status
          )}`}
        >
          {getStatusLabel(fulfillment.status)}
        </span>
      </div>

      {/* Quantity Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Jumlah Darah Terkumpul</span>
          <span className="font-semibold text-gray-900">
            {fulfillment.quantity_collected} / {fulfillment.quantity_needed} kantong
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              stats.isCompleted ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(stats.quantityProgress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{stats.quantityProgress}% terpenuhi</p>
      </div>

      {/* Donor Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{stats.totalNotified}</p>
          <p className="text-xs text-gray-600">Diberitahu</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{stats.confirmedCount}</p>
          <p className="text-xs text-gray-600">Konfirmasi</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">{stats.completedCount}</p>
          <p className="text-xs text-gray-600">Selesai</p>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
          <p className="text-xs text-gray-600">Menunggu</p>
        </div>
      </div>

      {/* Response & Completion Rates */}
      {stats.totalNotified > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className="text-gray-600">Tingkat Respons: </span>
              <span className="font-semibold text-gray-900">{stats.responseRate}%</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Tingkat Penyelesaian: </span>
              <span className="font-semibold text-gray-900">{stats.completionRate}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Rejected & Expired */}
      {(stats.rejectedCount > 0 || stats.expiredCount > 0) && (
        <div className="mt-3 flex gap-4 text-xs text-gray-500">
          {stats.rejectedCount > 0 && <span>Ditolak: {stats.rejectedCount}</span>}
          {stats.expiredCount > 0 && <span>Kadaluarsa: {stats.expiredCount}</span>}
          {stats.failedCount > 0 && <span>Gagal: {stats.failedCount}</span>}
        </div>
      )}
    </div>
  );
}
