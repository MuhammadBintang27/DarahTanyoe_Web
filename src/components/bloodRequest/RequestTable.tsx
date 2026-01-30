import { CheckCircle, XCircle, Clock, Package, AlertCircle, Calendar, Megaphone } from 'lucide-react';
import { BloodRequest } from '@/types/bloodRequest';
import { StatusBadge } from './StatusBadge';
import { formatDate, padId } from '@/utils/formatters';
import { useAllocation } from '@/hooks/useAllocation';
import { useEffect, useState } from 'react';

interface RequestTableProps {
  data: BloodRequest[];
  loading: Record<string, boolean>;
  currentPage: number;
  itemsPerPage: number;
  userRole: 'hospital' | 'pmi';
  bloodStock?: Array<{ blood_type: string; quantity: number }>;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onViewDetail?: (request: BloodRequest) => void;
  onCreatePickup?: (requestId: string) => void;
  onCreateCampaign?: (requestId: string) => void;
}

export const RequestTable: React.FC<RequestTableProps> = ({
  data,
  loading,
  currentPage,
  itemsPerPage,
  userRole,
  bloodStock = [],
  onApprove,
  onReject,
  onViewDetail,
  onCreatePickup,
  onCreateCampaign,
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const [allocationCache, setAllocationCache] = useState<Record<string, any>>({});

  // Helper function to check if blood stock is sufficient
  const isStockSufficient = (bloodType: string, quantity: number): boolean => {
    const stock = bloodStock.find(s => s.blood_type === bloodType);
    return stock ? stock.quantity >= quantity : false;
  };

  // NEW: Helper to check if allocation + free stock is sufficient (for Opsi 2)
  // Shows "Buat Jadwal Pickup" if we have enough blood from ANY source (allocations OR free stock)
  // Shows "Buat Kampanye Pemenuhan" only if we DON'T have enough from available sources
  const isAllocationSufficient = (requestId: string, quantity: number): boolean => {
    const data = allocationCache[requestId];
    if (!data) return false;
    
    // From /with-free-stock endpoint:
    // data.summary = { total_available: X, from_allocation: Y, from_free_stock: Z }
    if (data.summary?.total_available !== undefined) {
      return data.summary.total_available >= quantity;
    }
    
    // Fallback for old /available endpoint response
    if (data.summary?.total_available !== undefined) {
      return data.summary.total_available >= quantity;
    }
    
    return false;
  };

  // Fetch allocations + free stock for all requests
  useEffect(() => {
    const fetchAllocations = async () => {
      const newCache: Record<string, any> = {};
      
      for (const request of data) {
        if (['approved', 'in_fulfillment', 'ready'].includes(request.status)) {
          try {
            // Fetch BOTH allocations and free stock for complete picture
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/allocation/request/${request.id}/with-free-stock`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                },
              }
            );
            
            if (response.ok) {
              const jsonData = await response.json();
              newCache[request.id] = jsonData.data || jsonData;
            }
          } catch (error) {
            console.error(`Failed to fetch allocations for ${request.id}:`, error);
          }
        }
      }
      
      setAllocationCache(newCache);
    };

    if (data.length > 0 && userRole === 'pmi') {
      fetchAllocations();
    }
  }, [data, userRole]);

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
                No.
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
                <>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Alokasi Darah
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Aksi
                  </th>
                </>
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
                {row.quantity}
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
                  <>
                    {/* NEW: Allocation Status Column */}
                    <td className="px-6 py-4 text-sm">
                      {['approved', 'in_fulfillment', 'ready'].includes(row.status) ? (
                        <div className="space-y-1">
                          {allocationCache[row.id] ? (
                            <>
                              <div className="text-xs font-semibold text-gray-700">
                                {allocationCache[row.id].summary?.total_from_allocation || 0}/{row.quantity} kantong
                              </div>
                              {allocationCache[row.id].summary && (
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      allocationCache[row.id].summary.total_from_allocation >= row.quantity
                                        ? 'bg-green-500'
                                        : 'bg-yellow-500'
                                    }`}
                                    style={{
                                      width: `${
                                        Math.min((allocationCache[row.id].summary.total_from_allocation / row.quantity) * 100, 100)
                                      }%`,
                                    }}
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">Loading...</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                  </>
                )}
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
                      <div className="flex gap-2">
                        {isAllocationSufficient(row.id, row.quantity) ? (
                          <button
                            onClick={() => onCreatePickup?.(row.id)}
                            disabled={loading[row.id]}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
                          >
                            <Calendar size={14} />
                            Buat Jadwal Pickup
                          </button>
                        ) : (
                          <button
                            onClick={() => onCreateCampaign?.(row.id)}
                            disabled={loading[row.id]}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
                          >
                            <Megaphone size={14} />
                            Buat Kampanye Pemenuhan
                          </button>
                        )}
                      </div>
                    )}
                    {row.status === 'ready' && (
                      <div className="flex gap-2">
                        {isAllocationSufficient(row.id, row.quantity) && (
                          <button
                            onClick={() => onCreatePickup?.(row.id)}
                            disabled={loading[row.id]}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
                          >
                            <Calendar size={14} />
                            Buat Jadwal Pickup
                          </button>
                        )}
                      </div>
                    )}
                    {row.status === 'in_fulfillment' && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Clock size={16} />
                        <span className="text-xs font-medium">Sedang Dipenuhi</span>
                      </div>
                    )}
                    {row.status === 'pickup_scheduled' && (
                      <div className="flex items-center gap-2 text-purple-600">
                        <Package size={16} />
                        <span className="text-xs font-medium">Pickup Dijadwalkan</span>
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
