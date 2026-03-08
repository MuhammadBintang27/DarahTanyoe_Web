import { useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/authContext';

/**
 * Hospital Dashboard Metrics
 */
export interface HospitalDashboardData {
  activeRequests: number;
  completedRequests: number;
  readyForPickup: number;
  fulfillmentRate: number;
  requestsByBloodType?: {
    type: string;
    count: number;
  }[];
  requestsTrend?: {
    month: string;
    count: number;
  }[];
  requestsTrendByYear?: {
    [year: number]: { month: string; count: number }[];
  };
  availableYears?: number[];
  recentRequests?: any[];
}

/**
 * PMI Dashboard Metrics
 */
export interface PMIDashboardData {
  activeCampaigns?: number;
  runningRequests?: number; // Permintaan berjalan (pending/approved/in_fulfillment)
  completedRequests?: number; // Permintaan selesai
  fulfillmentRate?: number; // Tingkat pemenuhan
  totalStockByType?: {
    type: string;
    quantity: number;
    expiryDate?: string;
  }[];
  lowStockAlerts?: {
    type: string;
    quantity: number;
    daysLeft?: number;
  }[];
  requestsByBloodType?: {
    type: string;
    count: number;
  }[];
  requestsTrend?: {
    month: string;
    count: number;
  }[];
  requestsTrendByYear?: {
    [year: number]: { month: string; count: number }[];
  };
  availableYears?: number[];
}

interface UseDashboardDataReturn {
  data: HospitalDashboardData | PMIDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getChartDataForYear?: (year: number) => Promise<any>;
}

/**
 * Hook untuk fetch Hospital Dashboard Data
 */
export const useHospitalDashboard = (): UseDashboardDataReturn => {
  const { user } = useAuth();
  const [data, setData] = useState<HospitalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // All blood types
  const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get all blood requests for this hospital (list for tables & local charts)
      const [requestsResponse, chartsResponse] = await Promise.all([
        // Just get recent requests for table display (limit OK here)
        api.get(`/bloodReq/${user.id}`, { params: { limit: 50 } }).catch(err => {
          console.warn('[Hospital Dashboard] Failed to fetch requests:', err);
          return { data: { data: [] } };
        }),
        // Get pre-aggregated chart data
        api.get(`/dashboard/rs/${user.id}/charts`).catch(err => {
          console.warn('[Hospital Dashboard] Failed to fetch charts:', err);
          return { data: { data: {} } };
        })
      ]);

      const requests = Array.isArray(requestsResponse.data?.data) ? requestsResponse.data.data : [];
      const chartData = chartsResponse.data?.data || {};

      // Fetch cached summary for faster metrics
      let summaryCounts: Record<string, number> | null = null
      let upcomingPickups = 0
      try {
        const { data: summaryResp } = await api.get(`/dashboard/rs/${user.id}/summary`)
        summaryCounts = summaryResp?.data?.request_counts || null
        upcomingPickups = summaryResp?.data?.upcoming_pickups || 0
      } catch {
        summaryCounts = null
      }

      // Calculate metrics (prefer summary when available)
      const activeRequests = summaryCounts
        ? ((summaryCounts['pending'] || 0) + (summaryCounts['approved'] || 0) + (summaryCounts['in_fulfillment'] || 0))
        : requests.filter((r: any) => r && r.status && ['pending', 'approved', 'in_fulfillment'].includes(r.status)).length

      const completedRequests = summaryCounts
        ? (summaryCounts['completed'] || 0)
        : requests.filter((r: any) => r && r.status === 'completed').length
      
      const readyForPickup = summaryCounts
        ? (summaryCounts['pickup_scheduled'] || 0)
        : requests.filter((r: any) => r && r.status === 'pickup_scheduled').length

      const totalRequests = summaryCounts
        ? Object.values(summaryCounts).reduce((a,b)=>a+b,0)
        : requests.length

      const fulfillmentRate = totalRequests > 0
        ? Math.round(((completedRequests) / totalRequests) * 100)
        : 0

      // Build requests by blood type map from chart data
      const requestsByBloodType = chartData.bloodTypeDistribution || [];

      // Get monthly trends from chart data
      const requestsTrend = chartData.monthlyTrends || [];
      const availableYears = chartData.availableYears || [new Date().getFullYear()];
      
      // Build yearly trend data from API if needed
      const requestsTrendByYear: { [year: number]: { month: string; count: number }[] } = {};
      
      // For now, just use current year data. In future, we can call API with year parameter
      const currentYear = new Date().getFullYear();
      requestsTrendByYear[currentYear] = requestsTrend;

      setData({
        activeRequests,
        completedRequests,
        readyForPickup,
        fulfillmentRate,
        requestsByBloodType,
        requestsTrend,
        requestsTrendByYear,
        availableYears,
        recentRequests: requests.slice(0, 5),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memuat data dashboard rumah sakit';
      setError(errorMessage);
      console.error('[Hospital Dashboard]', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const getChartDataForYear = useCallback(async (year: number) => {
    if (!user?.id) return null;
    
    try {
      const { data: response } = await api.get(`/dashboard/rs/${user.id}/charts`, {
        params: { year }
      });
      return response?.data || null;
    } catch (error) {
      console.error('Error fetching chart data for year:', error);
      return null;
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, getChartDataForYear };
};

/**
 * Hook untuk fetch PMI Dashboard Data
 */
export const usePMIDashboard = (): UseDashboardDataReturn => {
  const { user } = useAuth();
  const [data, setData] = useState<PMIDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // All blood types
  const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get blood stock (detail listing)
      const { data: stockData } = await api.get(
        `/blood-stock/${user.id}`
      );

      const stocks = Array.isArray(stockData?.data) ? stockData.data : [];

      // Build stock map for all blood types
      const stockMap: { [key: string]: { quantity: number; expiryDate?: string } } = {};
      BLOOD_TYPES.forEach(type => {
        stockMap[type] = { quantity: 0, expiryDate: undefined };
      });

      // Merge with actual stocks
      stocks.forEach((stock: any) => {
        if (!stockMap[stock.blood_type]) {
          stockMap[stock.blood_type] = { quantity: 0, expiryDate: undefined };
        }
        stockMap[stock.blood_type].quantity += stock.quantity || 0;
        if (stock.expiry_date && !stockMap[stock.blood_type].expiryDate) {
          stockMap[stock.blood_type].expiryDate = stock.expiry_date;
        }
      });

      const totalStockByType = Object.entries(stockMap)
        .map(([type, data]) => ({
          type,
          quantity: data.quantity,
          expiryDate: data.expiryDate,
        }))
        .sort((a, b) => a.quantity - b.quantity); // Low stock first

      // Get low stock alerts (< 5 kantong atau 0)
      const lowStockAlerts = totalStockByType
        .filter((item: any) => item.quantity < 5)
        .map((item: any) => ({
          type: item.type,
          quantity: item.quantity,
          daysLeft: item.expiryDate 
            ? Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : undefined,
        }))
        .slice(0, 5); // Top 5 low stock items

      // Get blood requests for this PMI (as partner) and chart data
      const [requestsResponse, chartsResponse] = await Promise.all([
        // Just get recent requests for table display
        api.get(`/bloodReq/partner/${user.id}`, { params: { limit: 50 } }).catch(err => {
          console.warn('[PMI Dashboard] Failed to fetch requests:', err);
          return { data: { data: [] } };
        }),
        // Get pre-aggregated chart data
        api.get(`/dashboard/pmi/${user.id}/charts`).catch(err => {
          console.warn('[PMI Dashboard] Failed to fetch charts:', err);
          return { data: { data: {} } };
        })
      ]);
      
      const requestsData = Array.isArray(requestsResponse.data?.data) ? requestsResponse.data.data : [];
      const chartData = chartsResponse.data?.data || {};

      // Fetch cached summary for faster counts
      let summaryCounts: Record<string, number> | null = null
      try {
        const { data: summaryResp } = await api.get(`/dashboard/pmi/${user.id}/summary`)
        summaryCounts = summaryResp?.data?.request_counts || null
      } catch {
        summaryCounts = null
      }

      // Hitung permintaan berjalan & selesai (prefer summary when available)
      const runningRequests = summaryCounts
        ? ((summaryCounts['pending'] || 0) + (summaryCounts['approved'] || 0) + (summaryCounts['in_fulfillment'] || 0) + (summaryCounts['pickup_scheduled'] || 0))
        : requestsData.filter((r: any) => r && r.status && ['pending', 'approved', 'in_fulfillment', 'pickup_scheduled'].includes(r.status)).length

      const completedRequests = summaryCounts
        ? (summaryCounts['completed'] || 0)
        : requestsData.filter((r: any) => r && r.status === 'completed').length

      // Build requests by blood type map from chart data
      const requestsByBloodType = chartData.bloodTypeDistribution || [];
      
      // Get campaigns for this PMI
      let campaignsData: any[] = [];
      try {
        const { data: campResponse } = await api.get(`/campaigns?pmi_id=${user.id}&limit=100`);
        // Handle both paginated and non-paginated response
        if (campResponse?.data) {
          campaignsData = Array.isArray(campResponse.data) ? campResponse.data : [];
        } else if (Array.isArray(campResponse)) {
          campaignsData = campResponse;
        }
      } catch (err) {
        console.warn('[PMI Dashboard] Failed to fetch campaigns:', err);
        campaignsData = [];
      }

      const activeCampaigns = campaignsData.filter(
        (c: any) => c.status === 'active'
      ).length;

      // Calculate fulfillment rate
      const totalRequests = summaryCounts
        ? Object.values(summaryCounts).reduce((a,b)=>a+b,0)
        : requestsData.length

      const fulfillmentRate = totalRequests > 0
        ? Math.round((completedRequests / totalRequests) * 100)
        : 0

      // Get monthly trends and years from chart data
      const requestsTrend = chartData.monthlyTrends || [];
      const availableYears = chartData.availableYears || [new Date().getFullYear()];
      
      // Build yearly trend data from API if needed
      const requestsTrendByYear: { [year: number]: { month: string; count: number }[] } = {};
      
      // For now, just use current year data. In future, we can call API with year parameter
      const currentYear = new Date().getFullYear();
      requestsTrendByYear[currentYear] = requestsTrend;

      setData({
        activeCampaigns,
        runningRequests,
        completedRequests,
        fulfillmentRate,
        totalStockByType,
        lowStockAlerts,
        requestsByBloodType,
        requestsTrend,
        requestsTrendByYear,
        availableYears,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memuat data dashboard PMI';
      setError(errorMessage);
      console.error('[PMI Dashboard]', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const getChartDataForYear = useCallback(async (year: number) => {
    if (!user?.id) return null;
    
    try {
      const { data: response } = await api.get(`/dashboard/pmi/${user.id}/charts`, {
        params: { year }
      });
      return response?.data || null;
    } catch (error) {
      console.error('Error fetching PMI chart data for year:', error);
      return null;
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, getChartDataForYear };
};

/**
 * Hook untuk auto-refresh dashboard data
 */
export const useAutoRefresh = (refetch: () => Promise<void>, interval: number = 60000) => {
  useEffect(() => {
    const timer = setInterval(() => {
      refetch();
    }, interval);

    return () => clearInterval(timer);
  }, [refetch, interval]);
};
