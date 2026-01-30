"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Toaster } from "react-hot-toast";
import axios from "axios";

import ProtectedRoute from "@/components/protectedRoute/protectedRoute";
import { useAuth } from "@/context/authContext";

import { FilterSection } from "@/components/bloodRequest/FilterSection";
import { RequestTable } from "@/components/bloodRequest/RequestTable";
import { RejectModal } from "@/components/bloodRequest/RejectModal";
import { CreateRequestModal } from "@/components/bloodRequest/CreateRequestModal";
import { RequestDetailModal } from "@/components/bloodRequest/RequestDetailModal";
import { CreatePickupModal } from "@/components/bloodRequest/CreatePickupModal";
import { Pagination } from "@/components/common/Pagination";

import { useBloodRequests, usePartners, useBloodStock } from "@/hooks/useBloodRequests";
import { useAllocation } from "@/hooks/useAllocation";
import { FilterState, CreateRequestForm, BloodRequest } from "@/types/bloodRequest";
import { formatDateToAPI } from "@/utils/formatters";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 10;

const Permintaan: React.FC = () => {
  const { user } = useAuth();
  
  // Determine user role from institution_type (hospital or pmi)
  const userRole = user?.institution_type || 'hospital';
  
  // Custom hooks for data fetching
  const { data, refetch } = useBloodRequests(user?.id, userRole);
  const { partners } = usePartners();
  const { bloodStock } = useBloodStock(userRole === 'pmi' ? user?.id : undefined);

  // State management
  const [filters, setFilters] = useState<FilterState>({
    date: "",
    bloodType: "",
    location: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState<BloodRequest | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState<BloodRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [requestAllocations, setRequestAllocations] = useState<Record<string, any>>({}); // Cache allocations

  // Filter data
  const filteredData = data.filter((row) => {
    if (filters.bloodType && row.blood_type !== filters.bloodType) return false;
    if (filters.location && row.partners?.name !== filters.location) return false;
    if (filters.date) {
      const rowDate = new Date(row.created_at).toISOString().split("T")[0];
      if (rowDate !== filters.date) return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Handlers
  const handleApprove = async (requestId: string) => {
    try {
      setLoading((prev) => ({ ...prev, [requestId]: true }));

      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/partners/approve/${requestId}`
      );

      toast.success(response.data.message || "Permintaan berhasil disetujui");
      refetch();
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast.error(
        error.response?.data?.message || "Gagal menyetujui permintaan"
      );
    } finally {
      setLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleReject = async (reason: string) => {
    if (!showRejectModal) return;

    try {
      setLoading((prev) => ({ ...prev, [showRejectModal]: true }));

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/partners/reject/${showRejectModal}`,
        { rejection_reason: reason }
      );

      toast.success("Permintaan berhasil ditolak");
      setShowRejectModal(null);
      refetch();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast.error(error.response?.data?.message || "Gagal menolak permintaan");
    } finally {
      setLoading((prev) => ({ ...prev, [showRejectModal]: false }));
    }
  };

  const handleCreateRequest = async (formData: CreateRequestForm) => {
    try {
      setLoading((prev) => ({ ...prev, create: true }));

      const payload = {
        ...formData,
        requester_id: user?.id,
        quantity: Number(formData.quantity),
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/bloodReq/create`,
        payload
      );

      toast.success("Permintaan darah berhasil dibuat");
      setShowCreateModal(false);
      refetch();
    } catch (error: any) {
      console.error("Error creating request:", error);
      toast.error(error.response?.data?.message || "Gagal membuat permintaan");
    } finally {
      setLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleResetFilters = () => {
    setFilters({ date: "", bloodType: "", location: "" });
    setCurrentPage(1);
  };

  const handleCreatePickup = async (requestId: string) => {
    // Find the request to show in modal
    const request = data.find(r => r.id === requestId);
    if (request) {
      setShowPickupModal(request);
    }
  };

  const handleSubmitPickup = async (pickupData: { 
    pickupDate: string; 
    pickupTime: string; 
    notes?: string;
    allocations?: Array<{ allocation_id: string; quantity_picked_up: number }>;
    free_stock?: Array<{ stock_id: string; quantity_picked_up: number }>;
  }) => {
    if (!showPickupModal) return;

    try {
      setLoading((prev) => ({ ...prev, [`pickup_${showPickupModal.id}`]: true }));

      const token = localStorage.getItem("authToken");
      
      // Check if there's free_stock to handle
      const hasFreeStock = (pickupData.free_stock?.length ?? 0) > 0;
      const hasAllocations = (pickupData.allocations?.length ?? 0) > 0;
      
      console.log('🔍 handleSubmitPickup - Form data received:', {
        hasFreeStock,
        hasAllocations,
        allocations_count: pickupData.allocations?.length ?? 0,
        free_stock_count: pickupData.free_stock?.length ?? 0,
        allocations_detail: pickupData.allocations,
        free_stock_detail: pickupData.free_stock
      });
      
      // Use unified endpoint for both allocation-only and combined pickups
      // Accept EITHER allocations OR free_stock (or both)
      if (hasAllocations || hasFreeStock) {
        console.log('📦 Creating pickup via unified endpoint (works for both allocation-only and combined sources)');
        
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/allocation/request/${showPickupModal.id}/confirm-with-free-stock`,
          {
            pickupDate: pickupData.pickupDate,
            pickupTime: pickupData.pickupTime,
            allocations: pickupData.allocations || [],
            free_stock: pickupData.free_stock || []  // Empty array if no free stock
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        const allocCount = pickupData.allocations?.length ?? 0;
        const stockCount = pickupData.free_stock?.length ?? 0;
        const message = stockCount > 0 && allocCount > 0
          ? `Jadwal pickup berhasil dibuat! Darah dari ${allocCount} allocation + ${stockCount} free stock`
          : stockCount > 0
          ? `Jadwal pickup berhasil dibuat! Darah dari ${stockCount} free stock`
          : `Jadwal pickup berhasil dibuat! Darah dari ${allocCount} allocation`;
        
        toast.success(response.data.message || message);
      } else {
        toast.error("Tidak ada allocation atau free stock yang dipilih");
        return;
      }
      
      // Close modal immediately
      setShowPickupModal(null);
      
      // Refetch data after a short delay to let backend process
      setTimeout(() => {
        refetch();
      }, 500);
    } catch (error: any) {
      console.error("Error creating pickup schedule:", error);
      toast.error(error.response?.data?.message || "Gagal membuat jadwal pickup");
    } finally {
      setLoading((prev) => ({ ...prev, [`pickup_${showPickupModal.id}`]: false }));
    }
  };

  const handleCreateCampaign = async (requestId: string) => {
    // Find the request to show modal
    const request = data.find(r => r.id === requestId);
    if (request) {
      setShowCampaignModal(request);
    }
  };

  const confirmCreateCampaign = async () => {
    if (!showCampaignModal) return;
    
    try {
      setLoading((prev) => ({ ...prev, [`campaign_${showCampaignModal.id}`]: true }));

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      console.log('API URL:', API_BASE_URL);

      // Step 1: Search and Create Campaign dengan data lengkap
      const payload = {
        blood_request_id: showCampaignModal.id,
        pmi_id: user?.id, // PMI ID dari user yang login
        patient_name: showCampaignModal.patient_name,
        blood_type: showCampaignModal.blood_type,
        quantity_needed: showCampaignModal.quantity,
        urgency_level: showCampaignModal.urgency_level || 'medium',
        search_radius_km: 20,
        target_donors: 50
      };

      console.log('Payload:', payload);

      // Call Step 1 endpoint: search-and-create
      const response = await axios.post(
        `${API_BASE_URL}/fulfillment/search-and-create`,
        payload
      );

      console.log('Response:', response.data);

      // Check if response is successful
      // Check if response is successful
      if (response.status === 200 || response.status === 201) {
        toast.success("Campaign berhasil dibuat! Menemukan donor eligible.");
        
        // Get fulfillment ID from response
        const fulfillmentId = response.data.fulfillment_id || response.data.data?.fulfillment_id;
        
        // Store campaign data in session storage for slider view
        if (fulfillmentId && response.data) {
          sessionStorage.setItem(
            `fulfillment_${fulfillmentId}`,
            JSON.stringify(response.data)
          );
        }
        
        setShowCampaignModal(null);
        refetch();
        
        // Redirect ke halaman pemenuhan
        if (fulfillmentId) {
          setTimeout(() => {
            window.location.href = `/pemenuhan/${fulfillmentId}`;
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || error.message || "Gagal membuat kampanye pemenuhan");
    } finally {
      setLoading((prev) => ({ ...prev, [`campaign_${showCampaignModal.id}`]: false }));
    }
  };

  return (
    <ProtectedRoute>
      <Toaster position="top-right" />
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-3xl text-white">Daftar Permintaan</h2>
          
          {/* Show Create Button only for Hospital role */}
          {userRole === 'hospital' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus size={20} />
              Buat Permintaan
            </button>
          )}
        </div>

        {/* Filter Section */}
        <FilterSection
          filters={filters}
          partners={partners}
          onFilterChange={setFilters}
          onReset={handleResetFilters}
        />

        {/* Table Section */}
        <div>
          <RequestTable
            data={currentData}
            loading={loading}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            userRole={userRole}
            bloodStock={bloodStock}
            onApprove={userRole === 'pmi' ? handleApprove : undefined}
            onReject={userRole === 'pmi' ? (id) => setShowRejectModal(id) : undefined}
            onViewDetail={(request) => setSelectedRequest(request)}
            onCreatePickup={userRole === 'pmi' ? handleCreatePickup : undefined}
            onCreateCampaign={userRole === 'pmi' ? handleCreateCampaign : undefined}
          />

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredData.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Request Detail Modal */}
        <RequestDetailModal
          isOpen={!!selectedRequest}
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />

        {/* Modals - Only for PMI */}
        {userRole === 'pmi' && (
          <>
            <RejectModal
              isOpen={!!showRejectModal}
              loading={loading[showRejectModal || ''] || false}
              onClose={() => setShowRejectModal(null)}
              onConfirm={handleReject}
            />

            {/* Create Pickup Modal */}
            {showPickupModal && (
              <CreatePickupModal
                isOpen={!!showPickupModal}
                loading={loading[`pickup_${showPickupModal.id}`] || false}
                requestId={showPickupModal.id}
                patientName={showPickupModal.patient_name}
                bloodType={showPickupModal.blood_type}
                quantity={showPickupModal.quantity}
                hospitalName={showPickupModal.requester?.institution_name || 'Rumah Sakit'}
                onClose={() => setShowPickupModal(null)}
                onSubmit={handleSubmitPickup}
              />
            )}

            {/* Create Campaign Modal */}
            {showCampaignModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Buat Kampanye Pemenuhan
                  </h3>
                  
                  <div className="mb-6 space-y-3">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-sm text-orange-800 mb-2">
                        <strong>Stok tidak mencukupi!</strong>
                      </p>
                      <p className="text-xs text-orange-700">
                        Sistem akan mencari donor yang sesuai dalam radius 20km dan mengirimkan notifikasi kepada mereka.
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Golongan Darah:</span>
                        <span className="font-semibold text-gray-900">{showCampaignModal.blood_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jumlah Dibutuhkan:</span>
                        <span className="font-semibold text-gray-900">{showCampaignModal.quantity} kantong</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nama Pasien:</span>
                        <span className="font-semibold text-gray-900">{showCampaignModal.patient_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rumah Sakit:</span>
                        <span className="font-semibold text-gray-900">
                          {showCampaignModal.requester?.institution_name || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCampaignModal(null)}
                      disabled={loading[`campaign_${showCampaignModal.id}`]}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={confirmCreateCampaign}
                      disabled={loading[`campaign_${showCampaignModal.id}`]}
                      className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
                    >
                      {loading[`campaign_${showCampaignModal.id}`] ? 'Membuat...' : 'Buat Kampanye'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create Request Modal - Only for Hospital */}
        {userRole === 'hospital' && (
          <CreateRequestModal
            isOpen={showCreateModal}
            loading={loading.create || false}
            partners={partners}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateRequest}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Permintaan;
