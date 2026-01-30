import React from 'react';
import { Package, Calendar, AlertCircle } from 'lucide-react';
import { AllocationData } from '@/hooks/useAllocation';

interface AllocationCardProps {
  allocation: AllocationData;
  showQuantityInput?: boolean;
  onQuantityChange?: (newQty: number) => void;
  isExpired?: boolean;
}

/**
 * Component untuk display single allocation dengan batch info
 */
export const AllocationCard: React.FC<AllocationCardProps> = ({
  allocation,
  showQuantityInput = false,
  onQuantityChange,
  isExpired = false,
}) => {
  const statusColors = {
    allocated: 'bg-blue-100 text-blue-700',
    partial_pickup: 'bg-yellow-100 text-yellow-700',
    picked_up: 'bg-green-100 text-green-700',
    expired: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };

  const statusLabels = {
    allocated: '🔵 Menunggu Pengambilan',
    partial_pickup: '🟡 Sebagian Diambil',
    picked_up: '🟢 Semua Diambil',
    expired: '🔴 Kadaluarsa',
    cancelled: '⚫ Dibatalkan',
  };

  const quantityPending = allocation.quantity_allocated - (allocation.quantity_picked_up || 0);
  const isFullyPicked = quantityPending === 0;

  return (
    <div
      className={`border rounded-lg p-4 ${
        isExpired
          ? 'bg-red-50 border-red-200'
          : allocation.status === 'picked_up'
            ? 'bg-green-50 border-green-200'
            : 'bg-white border-gray-200'
      } hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Batch & Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Package size={18} className="text-gray-500" />
            <h4 className="font-semibold text-gray-900">{allocation.batch_number}</h4>
            <span
              className={`ml-auto px-2.5 py-1 rounded-full text-xs font-semibold ${
                statusColors[allocation.status]
              }`}
            >
              {statusLabels[allocation.status]}
            </span>
          </div>

          {/* Quantity Info */}
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-xs text-gray-500">Total Dialokasikan</p>
              <p className="text-lg font-bold text-gray-900">{allocation.quantity_allocated}</p>
            </div>
            {allocation.quantity_picked_up !== undefined && (
              <div>
                <p className="text-xs text-gray-500">Sudah Diambil</p>
                <p className="text-lg font-bold text-green-600">{allocation.quantity_picked_up}</p>
              </div>
            )}
          </div>

          {/* Expiry Date */}
          <div className="flex items-center gap-2 mt-3 text-sm">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-gray-600">Expire: </span>
            <span className={`font-semibold ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
              {new Date(allocation.expiry_date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          {isExpired && (
            <div className="flex items-center gap-2 mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              <AlertCircle size={14} />
              Darah sudah kadaluarsa
            </div>
          )}
        </div>

        {/* Right: Quantity Input (jika partial pickup) */}
        {showQuantityInput && !isFullyPicked && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-700">Ambil (kantong)</label>
            <input
              type="number"
              min="0"
              max={quantityPending}
              defaultValue={quantityPending}
              onChange={(e) => onQuantityChange?.(parseInt(e.target.value, 10))}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center font-semibold text-gray-900 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500">dari {quantityPending}</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {allocation.quantity_picked_up !== undefined && allocation.quantity_allocated > 0 && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isFullyPicked ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{
                width: `${(allocation.quantity_picked_up / allocation.quantity_allocated) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1 text-right">
            {allocation.quantity_picked_up}/{allocation.quantity_allocated} kantong
          </p>
        </div>
      )}
    </div>
  );
};
