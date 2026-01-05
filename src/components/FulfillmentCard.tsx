import React from 'react';
import { FulfillmentRequest } from '@/types/fulfillment';
import Link from 'next/link';

interface FulfillmentCardProps {
  fulfillment: FulfillmentRequest;
  onClick?: () => void;
}

export default function FulfillmentCard({ fulfillment, onClick }: FulfillmentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'donors_found':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      initiated: 'Diinisiasi',
      searching_donors: 'Mencari Pendonor',
      donors_found: 'Pendonor Ditemukan',
      in_progress: 'Dalam Proses',
      partially_fulfilled: 'Sebagian Terpenuhi',
      fulfilled: 'Terpenuhi',
      failed: 'Gagal',
      cancelled: 'Dibatalkan',
    };
    return labels[status] || status;
  };

  const getUrgencyLabel = (urgency: string) => {
    const labels: Record<string, string> = {
      critical: 'Kritis',
      high: 'Tinggi',
      medium: 'Sedang',
      low: 'Rendah',
    };
    return labels[urgency] || urgency;
  };

  const progressPercentage = fulfillment.quantity_needed > 0
    ? Math.round((fulfillment.quantity_collected / fulfillment.quantity_needed) * 100)
    : 0;

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-5 cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {fulfillment.patient_name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">ID: {fulfillment.id.slice(0, 8)}</span>
            <span className="text-gray-300">•</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${getUrgencyColor(fulfillment.urgency_level)}`}>
              {getUrgencyLabel(fulfillment.urgency_level)}
            </span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(fulfillment.status)}`}>
          {getStatusLabel(fulfillment.status)}
        </span>
      </div>

      {/* Blood Type & Quantity */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 font-bold text-sm">{fulfillment.blood_type}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500">Golongan Darah</p>
            <p className="text-sm font-semibold text-gray-900">{fulfillment.blood_type}</p>
          </div>
        </div>
        <div className="border-l border-gray-200 pl-4">
          <p className="text-xs text-gray-500">Kebutuhan</p>
          <p className="text-sm font-semibold text-gray-900">
            {fulfillment.quantity_collected} / {fulfillment.quantity_needed} kantong
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Donor Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>{fulfillment.confirmed_donors || 0} Konfirmasi</span>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{fulfillment.completed_donors || 0} Selesai</span>
        </div>
      </div>

      {/* Date */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
        Dibuat: {new Date(fulfillment.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
}
