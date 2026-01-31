"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/authContext';
import ProtectedRoute from '@/components/protectedRoute/protectedRoute';
import { useHospitalDashboard, HospitalDashboardData } from '@/hooks/useDashboardData';
import { MetricCard } from '@/components/cards/dashboardMetricCards';
import { PieChart, LineChart } from '@/components/charts/dashboardCharts';

const HospitalDashboard = () => {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useHospitalDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (!user || user.institution_type !== 'hospital') {
    return (
      <ProtectedRoute>
        <div className="text-center py-10">
          <p className="text-red-500">Access denied. This page is for hospitals only.</p>
        </div>
      </ProtectedRoute>
    );
  }

  const dashboardData = data as HospitalDashboardData | null;

  // Prepare pie chart data for blood type requests
  const pieChartData = (dashboardData?.requestsByBloodType || [])
    .filter((item: any) => item.count > 0)
    .map((item: any, idx: number) => ({
      label: `Darah ${item.type}`,
      value: item.count,
      color: '',
    }));

  return (
    <ProtectedRoute>
      <div className="w-full h-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-3xl text-white">
              Dashboard - {user.institution_name}
            </h2>
            <p className="text-gray-300 text-sm mt-1">Rumah Sakit</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className={`px-4 py-2 rounded-lg bg-blue-600 text-white font-medium transition-all ${
              isRefreshing || loading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-700'
            }`}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            <p className="font-medium">Error loading dashboard</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Metrics Row 1: Permintaan Aktif, Selesai, Ready for Pickup, Tingkat Pemenuhan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Permintaan Aktif"
            value={loading ? '-' : dashboardData?.activeRequests || 0}
            subtitle="requests menunggu"
            icon="📋"
            color="blue"
            isLoading={loading}
          />
          <MetricCard
            title="Permintaan Selesai"
            value={loading ? '-' : dashboardData?.completedRequests || 0}
            subtitle="requests terpenuhi"
            icon="✅"
            color="green"
            isLoading={loading}
          />
          <MetricCard
            title="Ready for Pickup"
            value={loading ? '-' : dashboardData?.readyForPickup || 0}
            subtitle="menunggu diambil"
            icon="🎁"
            color="yellow"
            isLoading={loading}
          />
          <MetricCard
            title="Tingkat Pemenuhan"
            value={loading ? '-' : `${dashboardData?.fulfillmentRate || 0}%`}
            subtitle="fulfillment rate"
            icon="📊"
            color="purple"
            isLoading={loading}
          />
        </div>

        {/* Recent Requests */}
        {dashboardData?.recentRequests && dashboardData.recentRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">5 Permintaan Terakhir</h3>
            <div className="space-y-3">
              {dashboardData.recentRequests.slice(0, 5).map((req: any) => (
                <div
                  key={req.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{req.patient_name}</p>
                    <p className="text-xs text-gray-600">
                      {req.blood_type} • {req.quantity} kantong • Status: {req.status}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded ${
                      req.urgency_level === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : req.urgency_level === 'high'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {req.urgency_level?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-max lg:auto-rows-auto">
          {/* Permintaan per Golongan Darah - Pie Chart */}
          <div className="h-fit">
            <PieChart
              title="📈 Permintaan per Golongan Darah"
              data={pieChartData}
              isLoading={loading}
            />
          </div>

          {/* Tren Permintaan 12 Bulan - Line Chart */}
          <div className="h-fit">
            <LineChart
              title="📊 Tren Permintaan per Bulan"
              data={dashboardData?.requestsTrendByYear?.[selectedYear] || dashboardData?.requestsTrend || []}
              isLoading={loading}
              selectedYear={selectedYear}
              availableYears={dashboardData?.availableYears || []}
              onYearChange={(year) => setSelectedYear(year)}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default HospitalDashboard;
