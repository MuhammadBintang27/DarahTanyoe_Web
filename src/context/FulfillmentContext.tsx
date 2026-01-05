'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  FulfillmentRequest, 
  DonorConfirmation, 
  FulfillmentFilters,
  CreateFulfillmentRequest,
  EligibleDonor,
  CodeVerificationRequest,
  CodeVerificationResponse,
  CompleteDonationRequest
} from '@/types/fulfillment';
import { fulfillmentApi } from '@/utils/api/fulfillment';

interface FulfillmentContextType {
  // State
  fulfillments: FulfillmentRequest[];
  currentFulfillment: FulfillmentRequest | null;
  confirmations: DonorConfirmation[];
  eligibleDonors: EligibleDonor[];
  loading: boolean;
  error: string | null;

  // Actions - Fulfillment Management
  fetchFulfillments: (filters?: FulfillmentFilters) => Promise<void>;
  getFulfillmentById: (id: string) => Promise<void>;
  createFulfillment: (data: CreateFulfillmentRequest) => Promise<FulfillmentRequest | null>;
  initiateFulfillment: (id: string) => Promise<void>;
  cancelFulfillment: (id: string, reason: string) => Promise<void>;

  // Actions - Donor Search & Management
  searchEligibleDonors: (fulfillmentId: string, filters?: any) => Promise<void>;
  notifyDonors: (fulfillmentId: string, donorIds: string[]) => Promise<void>;
  
  // Actions - Donor Confirmations
  getConfirmations: (fulfillmentId: string) => Promise<void>;
  verifyDonorCode: (data: CodeVerificationRequest) => Promise<CodeVerificationResponse>;
  completeDonation: (data: CompleteDonationRequest) => Promise<void>;
  
  // Utilities
  clearError: () => void;
  resetContext: () => void;
}

const FulfillmentContext = createContext<FulfillmentContextType | undefined>(undefined);

export function FulfillmentProvider({ children }: { children: React.ReactNode }) {
  const [fulfillments, setFulfillments] = useState<FulfillmentRequest[]>([]);
  const [currentFulfillment, setCurrentFulfillment] = useState<FulfillmentRequest | null>(null);
  const [confirmations, setConfirmations] = useState<DonorConfirmation[]>([]);
  const [eligibleDonors, setEligibleDonors] = useState<EligibleDonor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all fulfillments with optional filters
  const fetchFulfillments = useCallback(async (filters?: FulfillmentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fulfillmentApi.getAll(filters);
      setFulfillments(result || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch fulfillments');
      setFulfillments([]); // Reset to empty array on error
      console.error('Fetch fulfillments error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single fulfillment by ID
  const getFulfillmentById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fulfillmentApi.getById(id);
      setCurrentFulfillment(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch fulfillment details');
      console.error('Fetch fulfillment by ID error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new fulfillment request
  const createFulfillment = useCallback(async (data: CreateFulfillmentRequest) => {
    setLoading(true);
    setError(null);
    try {
      const newFulfillment = await fulfillmentApi.create(data);
      setFulfillments(prev => [newFulfillment, ...prev]);
      setCurrentFulfillment(newFulfillment);
      return newFulfillment;
    } catch (err: any) {
      setError(err.message || 'Failed to create fulfillment request');
      console.error('Create fulfillment error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initiate fulfillment (search donors and send notifications)
  const initiateFulfillment = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // Get fulfillment to extract blood_request_id
      const fulfillment = await fulfillmentApi.getById(id);
      const updated = await fulfillmentApi.initiate(fulfillment.blood_request_id);
      setCurrentFulfillment(updated);
      
      // Update in list
      setFulfillments(prev => 
        prev.map(f => f.id === id ? updated : f)
      );
    } catch (err: any) {
      setError(err.message || 'Failed to initiate fulfillment');
      console.error('Initiate fulfillment error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancel fulfillment
  const cancelFulfillment = useCallback(async (id: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      await fulfillmentApi.cancel({ fulfillment_id: id, reason });
      
      // Update in list
      setFulfillments(prev => 
        prev.map(f => f.id === id ? { ...f, status: 'cancelled', cancellation_reason: reason } : f)
      );
      
      if (currentFulfillment?.id === id) {
        setCurrentFulfillment(prev => 
          prev ? { ...prev, status: 'cancelled', cancellation_reason: reason } : null
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel fulfillment');
      console.error('Cancel fulfillment error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentFulfillment]);

  // Search eligible donors
  const searchEligibleDonors = useCallback(async (fulfillmentId: string, filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const donors = await fulfillmentApi.getEligibleDonors(fulfillmentId);
      setEligibleDonors(donors);
    } catch (err: any) {
      setError(err.message || 'Failed to search donors');
      console.error('Search donors error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Notify selected donors
  const notifyDonors = useCallback(async (fulfillmentId: string, donorIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      await fulfillmentApi.notifyDonors(fulfillmentId, donorIds);
      
      // Refresh confirmations
      await getConfirmations(fulfillmentId);
      
      // Refresh fulfillment details
      await getFulfillmentById(fulfillmentId);
    } catch (err: any) {
      setError(err.message || 'Failed to notify donors');
      console.error('Notify donors error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get donor confirmations for a fulfillment
  const getConfirmations = useCallback(async (fulfillmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fulfillmentApi.getConfirmations(fulfillmentId);
      setConfirmations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch confirmations');
      console.error('Fetch confirmations error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify donor code
  const verifyDonorCode = useCallback(async (data: CodeVerificationRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fulfillmentApi.verifyCode(data);
      
      // Update confirmation in state
      setConfirmations(prev => 
        prev.map(c => c.id === result.confirmation_id ? result.confirmation : c)
      );
      
      // Refresh fulfillment if needed
      if (currentFulfillment) {
        await getFulfillmentById(currentFulfillment.id);
      }
      
      return result; // Return result for UI
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
      console.error('Verify code error:', err);
      throw err; // Re-throw for UI handling
    } finally {
      setLoading(false);
    }
  }, [currentFulfillment]);

  // Complete donation
  const completeDonation = useCallback(async (data: CompleteDonationRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fulfillmentApi.completeDonation(data);
      
      // Update confirmation in state
      setConfirmations(prev => 
        prev.map(c => c.id === result.confirmation_id ? result.confirmation : c)
      );
      
      // Refresh fulfillment
      if (currentFulfillment) {
        await getFulfillmentById(currentFulfillment.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete donation');
      console.error('Complete donation error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentFulfillment]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset entire context
  const resetContext = useCallback(() => {
    setFulfillments([]);
    setCurrentFulfillment(null);
    setConfirmations([]);
    setEligibleDonors([]);
    setError(null);
  }, []);

  const value: FulfillmentContextType = {
    fulfillments,
    currentFulfillment,
    confirmations,
    eligibleDonors,
    loading,
    error,
    fetchFulfillments,
    getFulfillmentById,
    createFulfillment,
    initiateFulfillment,
    cancelFulfillment,
    searchEligibleDonors,
    notifyDonors,
    getConfirmations,
    verifyDonorCode,
    completeDonation,
    clearError,
    resetContext,
  };

  return (
    <FulfillmentContext.Provider value={value}>
      {children}
    </FulfillmentContext.Provider>
  );
}

export function useFulfillment() {
  const context = useContext(FulfillmentContext);
  if (context === undefined) {
    throw new Error('useFulfillment must be used within a FulfillmentProvider');
  }
  return context;
}

// Real-time subscription hook
export function useFulfillmentSubscription(fulfillmentId?: string) {
  const { getFulfillmentById, getConfirmations } = useFulfillment();

  useEffect(() => {
    if (!fulfillmentId) return;

    // Subscribe to real-time updates
    const subscription = fulfillmentApi.subscribeFulfillment(
      fulfillmentId,
      async (payload: any) => {
        console.log('Real-time update:', payload);
        
        // Refresh data on changes
        await getFulfillmentById(fulfillmentId);
        await getConfirmations(fulfillmentId);
      }
    );

    return () => {
      subscription();
    };
  }, [fulfillmentId, getFulfillmentById, getConfirmations]);
}
