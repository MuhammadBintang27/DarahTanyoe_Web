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
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-2xl font-bold text-gray-900">
            Detail Permintaan Darah
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 bg-white">
          {/* Status & Urgency */}
          <div className="bg-gray-50 rounded-xl border-2 border-gray-300 p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Status</label>
                <StatusBadge status={request.status} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Urgensi</label>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${urgencyInfo.color}`}>
                  {urgencyInfo.label}
                </span>
              </div>
              <div className="ml-auto">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Dibuat</label>
                <span className="text-sm font-semibold text-gray-900">
                  {formatDate(request.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-5">
            <h4 className="font-bold text-gray-900 mb-4 text-base">
              Informasi Pasien
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Nama Pasien</label>
                <p className="font-semibold text-gray-900">{request.patient_name}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">No. Telepon</label>
                <p className="font-semibold text-gray-900">{request.phone_number || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Golongan Darah</label>
                <p className="font-bold text-primary text-lg">{request.blood_type}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Jumlah</label>
                <p className="font-semibold text-gray-900">
                  {request.quantity} {request.unit_type || 'kantong'}
                </p>
              </div>
            </div>
          </div>

          {/* Medical Condition */}
          {request.medical_condition && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-5">
              <h4 className="font-bold text-gray-900 mb-3 text-base">
                Kondisi Medis
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-lg border border-gray-300">{request.medical_condition}</p>
            </div>
          )}

          {/* Notes */}
          {request.notes && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-5">
              <h4 className="font-bold text-gray-900 mb-3 text-base">
                Catatan Tambahan
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-lg border border-gray-300">{request.notes}</p>
            </div>
          )}

          {/* Requester Info */}
          {request.requester && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-5">
              <h4 className="font-bold text-gray-900 mb-4 text-base">
                Rumah Sakit Peminta
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Nama Institusi</label>
                  <p className="font-semibold text-gray-900">{request.requester.institution_name}</p>
                </div>
                {request.requester.address && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Alamat</label>
                    <p className="text-gray-700 text-sm leading-relaxed">{request.requester.address}</p>
                  </div>
                )}
                {request.requester.phone_number && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Kontak</label>
                    <p className="font-semibold text-gray-900">{request.requester.phone_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection/Cancellation Reason */}
          {(request.rejection_reason || request.cancellation_reason) && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-5">
              <h4 className="font-bold text-red-900 mb-3 text-base">
                {request.rejection_reason ? 'Alasan Penolakan' : 'Alasan Pembatalan'}
              </h4>
              <p className="text-sm text-red-700 leading-relaxed bg-white p-3 rounded-lg border border-gray-300">
                {request.rejection_reason || request.cancellation_reason}
              </p>
            </div>
          )}

          {/* Approval Info */}
          {request.approved_at && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-5">
              <h4 className="font-bold text-gray-900 mb-3 text-base">
                Informasi Persetujuan
              </h4>
              <div className="bg-white p-3 rounded-lg border border-gray-300">
                <p className="text-sm font-semibold text-green-700">
                  Disetujui: {formatDate(request.approved_at)}
                </p>
              </div>
            </div>
          )}

          {/* Fulfillment Info */}
          {request.fulfilled_at && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-5">
              <h4 className="font-bold text-gray-900 mb-3 text-base">
                Pemenuhan
              </h4>
              <div className="bg-white p-3 rounded-lg border border-gray-300 space-y-1">
                <p className="text-sm font-semibold text-blue-700">
                  Dipenuhi: {formatDate(request.fulfilled_at)}
                </p>
                {request.blood_bags_fulfilled && (
                  <p className="text-sm font-semibold text-blue-700">
                    Jumlah: {request.blood_bags_fulfilled}/{request.quantity} {request.unit_type || 'kantong'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-semibold text-sm border border-gray-300"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
