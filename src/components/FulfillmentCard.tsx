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
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'in_progress':
      case 'searching_donors':
      case 'initiated':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'donors_found':
      case 'partially_fulfilled':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'cancelled':
        return 'bg-gray-50 text-gray-700 border border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'donors_found':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'searching_donors':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const progressPercentage = fulfillment.quantity_needed > 0
    ? Math.round((fulfillment.quantity_collected / fulfillment.quantity_needed) * 100)
    : 0;

  return (
    <div
      className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-red-200 group"
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 truncate mb-3" title={fulfillment.patient_name}>
            {fulfillment.patient_name}
          </h3>
          <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg ${getStatusColor(fulfillment.status)}`}>
            <span>{getStatusLabel(fulfillment.status)}</span>
          </div>
        </div>

        {/* Blood Type & Quantity */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Golongan Darah</p>
              <p className="text-lg font-bold text-gray-900">{fulfillment.blood_type}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-600 mb-1">Kebutuhan</p>
              <p className="text-lg font-bold text-gray-900">
                <span className={progressPercentage >= 100 ? 'text-green-600' : 'text-red-600'}>
                  {fulfillment.quantity_collected}
                </span>
                <span className="text-gray-400 mx-1">/</span>
                {fulfillment.quantity_needed}
              </p>
              <p className="text-xs text-gray-500">kantong</p>
            </div>
          </div>
        </div>

        {/* Progress Bar - Enhanced */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-700">Progress Pemenuhan</span>
            <span className={`text-sm font-bold ${
              progressPercentage >= 100 ? 'text-green-600' : 'text-blue-600'
            }`}>
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ease-out ${
                progressPercentage >= 100 
                  ? 'bg-gradient-to-r from-green-400 to-green-600' 
                  : 'bg-gradient-to-r from-blue-400 to-blue-600'
              } shadow-md relative overflow-hidden`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Donor Stats - Enhanced */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs text-gray-500 font-medium">Konfirmasi</p>
                <p className="text-lg font-bold text-gray-900">{fulfillment.confirmed_donors || 0}</p>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs text-gray-500 font-medium">Selesai</p>
                <p className="text-lg font-bold text-gray-900">{fulfillment.completed_donors || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Date - Enhanced */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-gray-500 font-medium">
            {new Date(fulfillment.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
