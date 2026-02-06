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
      const { data: requestsData } = await api.get(
        `/bloodReq/${user.id}`
      );

      const requests = Array.isArray(requestsData?.data) ? requestsData.data : [];

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
        : requests.filter((r: any) => ['pending', 'approved', 'in_fulfillment'].includes(r.status)).length

      const completedRequests = summaryCounts
        ? (summaryCounts['completed'] || 0)
        : requests.filter((r: any) => r.status === 'completed').length
      
      const readyForPickup = summaryCounts
        ? (summaryCounts['pickup_scheduled'] || 0)
        : requests.filter((r: any) => r.status === 'pickup_scheduled').length

      const totalRequests = summaryCounts
        ? Object.values(summaryCounts).reduce((a,b)=>a+b,0)
        : requests.length

      const fulfillmentRate = totalRequests > 0
        ? Math.round(((completedRequests) / totalRequests) * 100)
        : 0

      // Build requests by blood type map
      const requestsMap: { [key: string]: number } = {};
      BLOOD_TYPES.forEach(type => {
        requestsMap[type] = 0;
      });

      requests.forEach((req: any) => {
        if (!requestsMap[req.blood_type]) {
          requestsMap[req.blood_type] = 0;
        }
        requestsMap[req.blood_type] += 1;
      });

      const requestsByBloodType = Object.entries(requestsMap)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // Generate yearly trend data (last 12 months)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentDate = new Date();
      const requestsTrend: { month: string; count: number }[] = [];

      // Create trend for last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthYear = monthDate.toISOString().substring(0, 7); // YYYY-MM
        const monthLabel = monthNames[monthDate.getMonth()];

        // Count requests for this month
        const monthCount = requests.filter((r: any) => {
          const reqDate = new Date(r.created_at).toISOString().substring(0, 7);
          return reqDate === monthYear;
        }).length;

        requestsTrend.push({
          month: monthLabel,
          count: monthCount,
        });
      }

      // Generate trends for all available years
      const allYears = new Set<number>();
      requests.forEach((r: any) => {
        const year = new Date(r.created_at).getFullYear();
        allYears.add(year);
      });

      // Always include current year
      allYears.add(new Date().getFullYear());

      const availableYears = Array.from(allYears).sort((a, b) => b - a);

      const requestsTrendByYear: { [year: number]: { month: string; count: number }[] } = {};

      availableYears.forEach(year => {
        const yearTrend: { month: string; count: number }[] = [];
        
        for (let month = 0; month < 12; month++) {
          const monthDate = new Date(year, month, 1);
          const monthYear = monthDate.toISOString().substring(0, 7); // YYYY-MM
          const monthLabel = monthNames[month];

          // Count requests for this month and year
          const monthCount = requests.filter((r: any) => {
            const reqDate = new Date(r.created_at).toISOString().substring(0, 7);
            return reqDate === monthYear;
          }).length;

          yearTrend.push({
            month: monthLabel,
            count: monthCount,
          });
        }

        requestsTrendByYear[year] = yearTrend;
      });

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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch hospital data';
      setError(errorMessage);
      console.error('[Hospital Dashboard]', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
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

      // Get blood requests for this PMI (as partner) for list/chart
      let requestsData: any[] = [];
      try {
        const { data: reqResponse } = await api.get(
          `/bloodReq/partner/${user.id}`
        );
        requestsData = Array.isArray(reqResponse?.data) ? reqResponse.data : [];
      } catch {
        requestsData = [];
      }

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
        : requestsData.filter((r: any) => ['pending', 'approved', 'in_fulfillment', 'pickup_scheduled'].includes(r.status)).length

      const completedRequests = summaryCounts
        ? (summaryCounts['completed'] || 0)
        : requestsData.filter((r: any) => r.status === 'completed').length

      // Build requests by blood type map
      const requestsMap: { [key: string]: number } = {};
      BLOOD_TYPES.forEach(type => {
        requestsMap[type] = 0;
      });

      requestsData.forEach((req: any) => {
        if (!requestsMap[req.blood_type]) {
          requestsMap[req.blood_type] = 0;
        }
        requestsMap[req.blood_type] += 1;
      });

      const requestsByBloodType = Object.entries(requestsMap)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // Get campaigns (if endpoint exists)
      let campaignsData: any[] = [];
      try {
        const { data: campResponse } = await api.get('/campaigns');
        campaignsData = Array.isArray(campResponse?.data) ? campResponse.data : [];
      } catch {
        campaignsData = [];
      }

      const activeCampaigns = campaignsData.filter(
        (c: any) => c.status === 'active' && c.type === 'fulfillment'
      ).length;

      // Calculate fulfillment rate
      const totalRequests = summaryCounts
        ? Object.values(summaryCounts).reduce((a,b)=>a+b,0)
        : requestsData.length

      const fulfillmentRate = totalRequests > 0
        ? Math.round((completedRequests / totalRequests) * 100)
        : 0

      // Generate yearly trend data (last 12 months)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentDate = new Date();
      const requestsTrend: { month: string; count: number }[] = [];

      // Create trend for last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthYear = monthDate.toISOString().substring(0, 7); // YYYY-MM
        const monthLabel = monthNames[monthDate.getMonth()];

        // Count requests for this month
        const monthCount = requestsData.filter((r: any) => {
          const reqDate = new Date(r.created_at).toISOString().substring(0, 7);
          return reqDate === monthYear;
        }).length;

        requestsTrend.push({
          month: monthLabel,
          count: monthCount,
        });
      }

      // Generate trends for all available years
      const allYears = new Set<number>();
      requestsData.forEach((r: any) => {
        const year = new Date(r.created_at).getFullYear();
        allYears.add(year);
      });

      // Always include current year
      allYears.add(new Date().getFullYear());

      const availableYears = Array.from(allYears).sort((a, b) => b - a);

      const requestsTrendByYear: { [year: number]: { month: string; count: number }[] } = {};

      availableYears.forEach(year => {
        const yearTrend: { month: string; count: number }[] = [];
        
        for (let month = 0; month < 12; month++) {
          const monthDate = new Date(year, month, 1);
          const monthYear = monthDate.toISOString().substring(0, 7); // YYYY-MM
          const monthLabel = monthNames[month];

          // Count requests for this month and year
          const monthCount = requestsData.filter((r: any) => {
            const reqDate = new Date(r.created_at).toISOString().substring(0, 7);
            return reqDate === monthYear;
          }).length;

          yearTrend.push({
            month: monthLabel,
            count: monthCount,
          });
        }

        requestsTrendByYear[year] = yearTrend;
      });

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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch PMI data';
      setError(errorMessage);
      console.error('[PMI Dashboard]', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
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
