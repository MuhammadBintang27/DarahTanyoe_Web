import { X } from 'lucide-react';
import { BloodRequest } from '@/types/bloodRequest';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '@/utils/formatters';

interface RequestDetailModalProps {
  isOpen: boolean;
  request: BloodRequest | null;
  onClose: () => void;
}

const urgencyLevelMap = {
  low: { label: 'Rendah', color: 'text-green-700 bg-green-100' },
  medium: { label: 'Sedang', color: 'text-yellow-700 bg-yellow-100' },
  high: { label: 'Tinggi', color: 'text-orange-700 bg-orange-100' },
  urgent: { label: 'Mendesak', color: 'text-red-700 bg-red-100' },
};

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  isOpen,
  request,
  onClose,
}) => {
  if (!isOpen || !request) return null;

  const urgency = request.urgency_level || 'medium';
  const urgencyInfo = urgencyLevelMap[urgency];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900">
            Detail Permintaan Darah
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Status & Urgency */}
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Status</label>
              <StatusBadge status={request.status} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Urgensi</label>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${urgencyInfo.color}`}>
                {urgencyInfo.label}
              </span>
            </div>
            <div className="ml-auto">
              <label className="text-xs text-gray-500 block mb-1">Dibuat</label>
              <span className="text-xs font-medium text-gray-900">
                {formatDate(request.created_at)}
              </span>
            </div>
          </div>

          {/* Patient Info */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Informasi Pasien</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-xs text-gray-600">Nama Pasien</label>
                <p className="font-medium text-gray-900">{request.patient_name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600">No. Telepon</label>
                <p className="font-medium text-gray-900">{request.phone_number || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600">Golongan Darah</label>
                <p className="font-bold text-primary text-base">{request.blood_type}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600">Jumlah</label>
                <p className="font-medium text-gray-900">
                  {request.quantity} {request.unit_type || 'kantong'}
                </p>
              </div>
            </div>
          </div>

          {/* Medical Condition */}
          {request.medical_condition && (
            <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Kondisi Medis</h4>
              <p className="text-sm text-gray-700">{request.medical_condition}</p>
            </div>
          )}

          {/* Notes */}
          {request.notes && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Catatan Tambahan</h4>
              <p className="text-sm text-gray-700">{request.notes}</p>
            </div>
          )}

          {/* Requester Info */}
          {request.requester && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Rumah Sakit Peminta</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <label className="text-xs text-gray-600">Nama Institusi</label>
                  <p className="font-medium text-gray-900">{request.requester.institution_name}</p>
                </div>
                {request.requester.address && (
                  <div>
                    <label className="text-xs text-gray-600">Alamat</label>
                    <p className="text-gray-700 text-xs">{request.requester.address}</p>
                  </div>
                )}
                {request.requester.phone_number && (
                  <div>
                    <label className="text-xs text-gray-600">Kontak</label>
                    <p className="text-gray-700">{request.requester.phone_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection/Cancellation Reason */}
          {(request.rejection_reason || request.cancellation_reason) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="font-semibold text-red-900 mb-1 text-sm">
                {request.rejection_reason ? 'Alasan Penolakan' : 'Alasan Pembatalan'}
              </h4>
              <p className="text-sm text-red-700">
                {request.rejection_reason || request.cancellation_reason}
              </p>
            </div>
          )}

          {/* Approval Info */}
          {request.approved_at && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h4 className="font-semibold text-green-900 mb-1 text-sm">Informasi Persetujuan</h4>
              <p className="text-xs text-green-700">
                Disetujui: {formatDate(request.approved_at)}
              </p>
            </div>
          )}

          {/* Fulfillment Info */}
          {request.fulfilled_at && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-semibold text-blue-900 mb-1 text-sm">Pemenuhan</h4>
              <p className="text-xs text-blue-700 mb-1">
                Dipenuhi: {formatDate(request.fulfilled_at)}
              </p>
              {request.blood_bags_fulfilled && (
                <p className="text-xs text-blue-700">
                  Jumlah: {request.blood_bags_fulfilled}/{request.quantity} {request.unit_type || 'kantong'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
