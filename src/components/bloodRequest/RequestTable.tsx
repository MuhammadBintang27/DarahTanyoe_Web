import { CheckCircle, XCircle, Clock, Package, AlertCircle } from 'lucide-react';
import { BloodRequest } from '@/types/bloodRequest';
import { StatusBadge } from './StatusBadge';
import { formatDate, padId } from '@/utils/formatters';

interface RequestTableProps {
  data: BloodRequest[];
  loading: Record<string, boolean>;
  currentPage: number;
  itemsPerPage: number;
  userRole: 'hospital' | 'pmi';
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onViewDetail?: (request: BloodRequest) => void;
}

export const RequestTable: React.FC<RequestTableProps> = ({
  data,
  loading,
  currentPage,
  itemsPerPage,
  userRole,
  onApprove,
  onReject,
  onViewDetail,
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-12 text-center text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <AlertCircle size={48} className="text-gray-300" />
            <p className="text-sm">Tidak ada data permintaan</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Nama Pasien
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Gol. Darah
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Jumlah
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Lokasi
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              {userRole === 'pmi' && (
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr 
                key={row.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewDetail?.(row)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {padId(startIndex + index + 1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {row.patient_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  {row.blood_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.blood_bags_fulfilled || 0}/{row.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(row.created_at)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {row.requester?.institution_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={row.status} />
                </td>
                {userRole === 'pmi' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                    {row.status === 'pending' && onApprove && onReject && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onReject(row.id)}
                          disabled={loading[row.id]}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
                        >
                          <XCircle size={14} />
                          Tolak
                        </button>
                        <button
                          onClick={() => onApprove(row.id)}
                          disabled={loading[row.id]}
                          className="bg-secondary hover:bg-secondary/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle size={14} />
                          {loading[row.id] ? '...' : 'Terima'}
                        </button>
                      </div>
                    )}
                    {row.status === 'approved' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Package size={16} />
                        <span className="text-xs font-medium">Siap Diambil</span>
                      </div>
                    )}
                    {row.status === 'in_fulfillment' && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Clock size={16} />
                        <span className="text-xs font-medium">Sedang Dipenuhi</span>
                      </div>
                    )}
                    {(row.status === 'rejected' ||
                      row.status === 'completed' ||
                      row.status === 'cancelled') && (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
