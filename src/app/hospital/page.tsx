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
        <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-2xl text-gray-900">Dashboard - {user.institution_name}</h2>
              <p className="text-gray-500 text-sm mt-1">Rumah Sakit</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className={`px-4 py-2 rounded-lg bg-primary text-white font-medium transition-all ${
                isRefreshing || loading
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:bg-primary/90'
              }`}
            >
              {isRefreshing ? 'Menyegarkan…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            <p className="font-medium">Error loading dashboard</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Permintaan Aktif"
            value={loading ? '-' : dashboardData?.activeRequests || 0}
            subtitle="requests menunggu"
            color="blue"
            isLoading={loading}
            variant="neutral"
          />
          <MetricCard
            title="Permintaan Selesai"
            value={loading ? '-' : dashboardData?.completedRequests || 0}
            subtitle="requests terpenuhi"
            color="green"
            isLoading={loading}
            variant="neutral"
          />
          <MetricCard
            title="Ready for Pickup"
            value={loading ? '-' : dashboardData?.readyForPickup || 0}
            subtitle="menunggu diambil"
            color="yellow"
            isLoading={loading}
            variant="neutral"
          />
          <MetricCard
            title="Tingkat Pemenuhan"
            value={loading ? '-' : `${dashboardData?.fulfillmentRate || 0}%`}
            subtitle="fulfillment rate"
            color="purple"
            isLoading={loading}
            variant="neutral"
          />
        </div>

        {/* Recent Requests - table style */}
        {dashboardData?.recentRequests && dashboardData.recentRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Permintaan Darah Terbaru</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Nama</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Gol. Darah</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Jumlah</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Tanggal</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Urgensi</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentRequests.slice(0, 5).map((req: any) => (
                    <tr key={req.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">{req.id}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{req.patient_name || '-'}</td>
                      <td className="py-3 px-4 text-gray-900">{req.blood_type || '-'}</td>
                      <td className="py-3 px-4 text-center text-gray-900">{req.quantity ?? '-'}</td>
                      <td className="py-3 px-4 text-gray-700">{req.created_at ? new Date(req.created_at).toLocaleDateString() : '-'}</td>
                      <td className="py-3 px-4 text-gray-700 capitalize">{req.status || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            req.urgency_level === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : req.urgency_level === 'high'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {(req.urgency_level || 'normal').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-max lg:auto-rows-auto">
          {/* Permintaan per Golongan Darah - Pie Chart */
          }
          <div className="h-fit">
            <PieChart
              title="Permintaan per Golongan Darah"
              data={pieChartData}
              isLoading={loading}
            />
          </div>

          {/* Tren Permintaan 12 Bulan - Line Chart */}
          <div className="h-fit">
            <LineChart
              title="Tren Permintaan per Bulan"
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
