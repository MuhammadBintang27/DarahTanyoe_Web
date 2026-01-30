import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface AllocationData {
  allocation_id: string;
  quantity_allocated: number;
  quantity_picked_up?: number;
  quantity_available?: number;
  quantity_pending?: number;
  status: 'allocated' | 'partial_pickup' | 'picked_up' | 'expired' | 'cancelled';
  batch_number: string;
  expiry_date: string;
  fulfillment_id?: string;
  fulfillment_patient?: string;
  source?: 'allocation' | 'free_stock';
  warning?: string | null;
}

export interface FreeStockData {
  stock_id: string;
  quantity: number;
  batch_number: string;
  expiry_date: string;
  source: 'free_stock';
  warning: string;
}

export interface AllocationSummary {
  total_allocations?: number;
  total_available?: number;
  total_needed?: number;
  can_complete_pickup?: boolean;
  pending_quantity?: number;
  // For flexible source
  total_from_allocation?: number;
  total_from_free_stock?: number;
  allocation_count?: number;
  free_stock_count?: number;
  note?: string;
}

export interface AvailableBloodResponse {
  message?: string;
  data: {
    request?: any;
    allocations: AllocationData[];
    summary: AllocationSummary;
  };
}

export interface BloodWithFreeStockResponse {
  message?: string;
  data: {
    request?: any;
    allocations: AllocationData[];
    free_stock: FreeStockData[];
    summary: AllocationSummary;
  };
}

/**
 * Custom hook untuk manage allocation data
 * Handles fetching available allocations, confirming pickups, dan managing state
 */
export const useAllocation = (requestId?: string) => {
  const [allocations, setAllocations] = useState<AllocationData[]>([]);
  const [freeStock, setFreeStock] = useState<FreeStockData[]>([]);
  const [summary, setSummary] = useState<AllocationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  /**
   * Fetch available allocations untuk request tertentu
   */
  const getAvailableAllocations = useCallback(
    async (id?: string) => {
      const targetId = id || requestId;
      if (!targetId) {
        setError('Request ID is required');
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<AvailableBloodResponse>(
          `${API_BASE_URL}/allocation/request/${targetId}/available`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const { allocations: allocData, summary: summaryData } = response.data.data;
        setAllocations(allocData);
        setSummary(summaryData);
        return { allocations: allocData, summary: summaryData };
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Gagal memuat allocation data';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [requestId, API_BASE_URL, token]
  );

  /**
   * Fetch blood dengan free stock options (flexible source)
   */
  const getBloodWithFreeStock = useCallback(
    async (id?: string) => {
      const targetId = id || requestId;
      if (!targetId) {
        setError('Request ID is required');
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<BloodWithFreeStockResponse>(
          `${API_BASE_URL}/allocation/request/${targetId}/with-free-stock`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const { allocations: allocData, free_stock: freeStockData, summary: summaryData } = response.data.data;
        setAllocations(allocData);
        setFreeStock(freeStockData);
        setSummary(summaryData);
        return { allocations: allocData, free_stock: freeStockData, summary: summaryData };
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Gagal memuat blood dengan free stock';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [requestId, API_BASE_URL, token]
  );

  /**
   * Confirm allocation pickup
   */
  const confirmPickup = useCallback(
    async (allocationId: string, quantityPickedUp: number) => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/allocation/${allocationId}/pickup`,
          { quantity_picked_up: quantityPickedUp },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        toast.success('Pickup berhasil dikonfirmasi');
        return response.data.data;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Gagal confirm pickup';
        toast.error(errorMsg);
        throw err;
      }
    },
    [API_BASE_URL, token]
  );

  /**
   * Confirm pickup dengan combined sources (allocation + free stock)
   */
  const confirmPickupWithFreeStock = useCallback(
    async (
      id: string,
      pickupData: {
        pickupDate: string;
        pickupTime: string;
        allocations: Array<{ allocation_id: string; quantity_picked_up: number }>;
        free_stock: Array<{ stock_id: string; quantity_picked_up: number }>;
      }
    ) => {
      const targetId = id || requestId;
      if (!targetId) {
        throw new Error('Request ID is required');
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/allocation/request/${targetId}/confirm-with-free-stock`,
          pickupData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        toast.success('Pickup dari allocation + free stock berhasil dikonfirmasi');
        return response.data.data;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Gagal confirm pickup dengan free stock';
        toast.error(errorMsg);
        throw err;
      }
    },
    [requestId, API_BASE_URL, token]
  );

  /**
   * Cancel allocation
   */
  const cancelAllocation = useCallback(
    async (allocationId: string, reason?: string) => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/allocation/${allocationId}/cancel`,
          { reason },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        toast.success('Allocation dibatalkan');
        return response.data.data;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Gagal cancel allocation';
        toast.error(errorMsg);
        throw err;
      }
    },
    [API_BASE_URL, token]
  );

  /**
   * Get allocation history
   */
  const getHistory = useCallback(
    async (id?: string) => {
      const targetId = id || requestId;
      if (!targetId) {
        setError('Request ID is required');
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/allocation/request/${targetId}/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        return response.data.data;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Gagal memuat history';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [requestId, API_BASE_URL, token]
  );

  /**
   * Get pending pickups
   */
  const getPendingPickups = useCallback(
    async (id?: string) => {
      const targetId = id || requestId;
      if (!targetId) {
        setError('Request ID is required');
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/allocation/request/${targetId}/pending`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        return response.data.data;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Gagal memuat pending pickups';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [requestId, API_BASE_URL, token]
  );

  /**
   * Check if can create pickup (total allocation >= qty needed)
   */
  const canCreatePickup = useCallback(
    (quantityNeeded: number): boolean => {
      if (!summary) return false;
      const total = (summary.total_available || 0) + (summary.total_from_free_stock || 0);
      return total >= quantityNeeded;
    },
    [summary]
  );

  return {
    // State
    allocations,
    freeStock,
    summary,
    loading,
    error,

    // Methods
    getAvailableAllocations,
    getBloodWithFreeStock,
    confirmPickup,
    confirmPickupWithFreeStock,
    cancelAllocation,
    getHistory,
    getPendingPickups,
    canCreatePickup,
  };
};
