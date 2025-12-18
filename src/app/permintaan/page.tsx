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
import { Pagination } from "@/components/common/Pagination";

import { useBloodRequests, usePartners, useBloodStock } from "@/hooks/useBloodRequests";
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
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);

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
    // TODO: Implement create pickup schedule modal/page
    toast.success("Fitur buat jadwal pickup akan segera hadir");
    console.log("Create pickup for request:", requestId);
  };

  const handleCreateCampaign = async (requestId: string) => {
    // TODO: Implement create campaign modal/page
    toast.success("Fitur buat kampanye pemenuhan akan segera hadir");
    console.log("Create campaign for request:", requestId);
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
          <RejectModal
            isOpen={!!showRejectModal}
            loading={loading[showRejectModal || ''] || false}
            onClose={() => setShowRejectModal(null)}
            onConfirm={handleReject}
          />
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
