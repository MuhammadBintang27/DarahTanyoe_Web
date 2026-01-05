/**
 * Fulfillment API Service
 * Handles all API calls for blood request fulfillment system
 */

import axios from 'axios';
import {
  FulfillmentRequest,
  DonorConfirmation,
  EligibleDonor,
  CreateFulfillmentRequest,
  SearchDonorsRequest,
  SearchDonorsResponse,
  CodeVerificationRequest,
  CodeVerificationResponse,
  CompleteDonationRequest,
  RetrySearchRequest,
  CancelFulfillmentRequest,
  FulfillmentProgress,
  FulfillmentFilters,
  PaginationParams,
  PaginatedResponse,
  FulfillmentStats,
} from '@/types/fulfillment';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Fulfillment API Client
 */
export const fulfillmentApi = {
  // ========================================
  // CREATE & INITIATE
  // ========================================

  /**
   * Create a new fulfillment request
   */
  async create(data: CreateFulfillmentRequest): Promise<FulfillmentRequest> {
    try {
      const response = await apiClient.post('/fulfillment', data);
      return response.data.data.fulfillment;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create fulfillment request');
    }
  },

  /**
   * Initiate fulfillment (search donors and send notifications)
   */
  async initiate(fulfillmentId: string): Promise<FulfillmentRequest> {
    try {
      const response = await apiClient.post(`/fulfillment/${fulfillmentId}/initiate`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to initiate fulfillment');
    }
  },

  // ========================================
  // READ / QUERY
  // ========================================

  /**
   * Get all fulfillment requests with filters
   */
  async getAll(
    filters?: FulfillmentFilters,
    pagination?: PaginationParams
  ): Promise<FulfillmentRequest[]> {
    try {
      const params = new URLSearchParams();
      
      // Add filters
      if (filters?.status) params.append('status', filters.status as string);
      if (filters?.blood_type) params.append('blood_type', filters.blood_type);
      if (filters?.pmi_id) params.append('pmi_id', filters.pmi_id);
      if (filters?.urgency_level) params.append('urgency_level', filters.urgency_level);
      
      // Add pagination
      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.limit) params.append('limit', pagination.limit.toString());
      
      const response = await apiClient.get(`/fulfillment?${params.toString()}`);
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch fulfillments');
    }
  },

  /**
   * Get single fulfillment by ID with full details
   */
  async getById(id: string): Promise<FulfillmentRequest> {
    try {
      const response = await apiClient.get(`/fulfillment/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch fulfillment details');
    }
  },

  /**
   * Get fulfillment progress/statistics
   */
  async getProgress(id: string): Promise<FulfillmentProgress> {
    const fulfillment = await this.getById(id);

    const pendingDonors =
      fulfillment.donor_confirmations?.filter((dc: any) => dc.status === 'pending').length || 0;

    return {
      fulfillment_id: fulfillment.id,
      status: fulfillment.status,
      target: fulfillment.quantity_needed,
      collected: fulfillment.quantity_collected,
      percentage: Math.round((fulfillment.quantity_collected / fulfillment.quantity_needed) * 100),
      confirmed_donors: fulfillment.confirmed_donors,
      completed_donors: fulfillment.completed_donors,
      pending_donors: pendingDonors,
      retry_count: fulfillment.retry_count,
      can_retry: fulfillment.retry_count < fulfillment.max_retries,
    };
  },

  /**
   * Get fulfillment statistics
   */
  async getStats(pmiId?: string): Promise<FulfillmentStats> {
    try {
      const params = pmiId ? `?pmi_id=${pmiId}` : '';
      const response = await apiClient.get(`/fulfillment/stats${params}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch fulfillment statistics');
    }
  },

  // ========================================
  // DONOR SEARCH & MATCHING
  // ========================================

  /**
   * Search and notify eligible donors (not needed - use initiate instead)
   */
  async searchDonors(request: SearchDonorsRequest): Promise<SearchDonorsResponse> {
    try {
      const response = await apiClient.post(`/fulfillment/${request.fulfillment_id}/initiate`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search donors');
    }
  },

  /**
   * Get eligible donors for fulfillment
   */
  async getEligibleDonors(fulfillmentId: string): Promise<EligibleDonor[]> {
    try {
      const response = await apiClient.get(`/fulfillment/${fulfillmentId}`);
      return response.data.data.eligible_donors || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch eligible donors');
    }
  },

  /**
   * Notify selected donors (already done in initiate)
   */
  async notifyDonors(fulfillmentId: string, donorIds: string[]): Promise<void> {
    // This is handled automatically by initiate endpoint
    return Promise.resolve();
  },

  /**
   * Retry donor search with adjusted criteria
   */
  async retrySearch(request: RetrySearchRequest): Promise<SearchDonorsResponse> {
    try {
      const response = await apiClient.post(`/fulfillment/${request.fulfillment_id}/initiate`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to retry donor search');
    }
  },

  // ========================================
  // DONOR CONFIRMATION
  // ========================================

  /**
   * Verify donor unique code
   */
  async verifyCode(request: CodeVerificationRequest): Promise<CodeVerificationResponse> {
    try {
      const response = await apiClient.post('/fulfillment/verify-code', request);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Invalid or expired code');
    }
  },

  /**
   * Get donor confirmation by ID (not needed for backend approach)
   */
  async getConfirmation(id: string): Promise<DonorConfirmation> {
    // This would be replaced by backend endpoint if needed
    throw new Error('Not implemented - use getConfirmations instead');
  },

  /**
   * Get all confirmations for a fulfillment
   */
  async getConfirmations(fulfillmentId: string): Promise<DonorConfirmation[]> {
    try {
      const response = await apiClient.get(`/fulfillment/${fulfillmentId}/confirmations`);
      return response.data.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch confirmations');
    }
  },

  // ========================================
  // DONATION COMPLETION
  // ========================================

  /**
   * Complete donation process
   */
  async completeDonation(request: CompleteDonationRequest): Promise<any> {
    try {
      const response = await apiClient.post('/fulfillment/complete-donation', request);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to complete donation');
    }
  },

  // ========================================
  // CANCEL & UPDATE
  // ========================================

  /**
   * Cancel fulfillment request
   */
  async cancel(request: CancelFulfillmentRequest): Promise<void> {
    try {
      await apiClient.patch(`/fulfillment/${request.fulfillment_id}/status`, {
        status: 'cancelled',
        cancellation_reason: request.reason
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel fulfillment');
    }
  },

  /**
   * Update fulfillment status
   */
  async updateStatus(id: string, status: string): Promise<void> {
    try {
      await apiClient.patch(`/fulfillment/${id}/status`, { status });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update status');
    }
  },

  /**
   * Update fulfillment notes
   */
  async updateNotes(id: string, notes: string): Promise<void> {
    try {
      await apiClient.patch(`/fulfillment/${id}/status`, { notes });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update notes');
    }
  },

  // ========================================
  // REAL-TIME SUBSCRIPTIONS (Disabled - use polling instead)
  // ========================================

  /**
   * Subscribe to fulfillment updates
   */
  subscribeFulfillment(
    fulfillmentId: string,
    callback: (payload: any) => void
  ): () => void {
    // For backend API, use polling instead of real-time subscriptions
    // Or implement WebSocket connection to backend
    const interval = setInterval(async () => {
      try {
        const data = await this.getById(fulfillmentId);
        callback({ new: data });
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Return cleanup function
    return () => {
      clearInterval(interval);
    };
  },

  /**
   * Subscribe to all fulfillments (for list view)
   */
  subscribeFulfillments(callback: (payload: any) => void): () => void {
    // For backend API, use polling instead
    const interval = setInterval(async () => {
      try {
        const data = await this.getAll();
        callback({ new: data });
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(interval);
    };
  },
};

export default fulfillmentApi;
