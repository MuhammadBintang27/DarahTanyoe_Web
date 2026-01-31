"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/authContext';
import ProtectedRoute from '@/components/protectedRoute/protectedRoute';
import { usePMIDashboard, PMIDashboardData } from '@/hooks/useDashboardData';
import { MetricCard } from '@/components/cards/dashboardMetricCards';
import { PieChart, LineChart } from '@/components/charts/dashboardCharts';

const PMIDashboard = () => {
  const { user } = useAuth();
  const { data, loading, error, refetch } = usePMIDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (!user || user.institution_type !== 'pmi') {
    return (
      <ProtectedRoute>
        <div className="text-center py-10">
          <p className="text-red-500">Access denied. This page is for PMI only.</p>
        </div>
      </ProtectedRoute>
    );
  }

  const dashboardData = data as PMIDashboardData | null;

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
            <p className="text-gray-300 text-sm mt-1">Palang Merah Indonesia</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className={`px-4 py-2 rounded-lg bg-red-600 text-white font-medium transition-all ${
              isRefreshing || loading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-red-700'
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

        {/* Metrics Row 1: Kampanye Aktif, Permintaan Berjalan, Permintaan Selesai, Tingkat Pemenuhan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Kampanye Aktif"
            value={loading ? '-' : dashboardData?.activeCampaigns || 0}
            subtitle="kampanye berjalan"
            icon="🎯"
            color="blue"
            isLoading={loading}
          />
          <MetricCard
            title="Permintaan Berjalan"
            value={loading ? '-' : dashboardData?.runningRequests || 0}
            subtitle="requests menunggu"
            icon="📋"
            color="yellow"
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
            title="Tingkat Pemenuhan"
            value={loading ? '-' : `${dashboardData?.fulfillmentRate || 0}%`}
            subtitle="fulfillment rate"
            icon="📊"
            color="purple"
            isLoading={loading}
          />
        </div>

        {/* Stok Darah - Tabel */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🩸 Stok Darah Lengkap</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Golongan Darah</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Stok</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  dashboardData?.totalStockByType?.map((stock: any) => (
                    <tr key={stock.type} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{stock.type}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-lg text-gray-900">{stock.quantity}</span>
                        <span className="text-gray-600 text-xs ml-1">kantong</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {stock.quantity === 0 ? (
                          <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">
                            🔴 URGENT
                          </span>
                        ) : stock.quantity < 5 ? (
                          <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                            ⚠️ LOW
                          </span>
                        ) : (
                          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                            ✅ NORMAL
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-700 text-xs">
                        {stock.quantity === 0 ? 'Butuh order pendonor urgently' : 
                         stock.quantity < 5 ? 'Monitor, siap order pendonor' : 
                         'Dalam kondisi baik'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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

export default PMIDashboard;
