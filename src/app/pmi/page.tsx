"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import ProtectedRoute from '@/components/protectedRoute/protectedRoute';
import { usePMIDashboard, PMIDashboardData } from '@/hooks/useDashboardData';
import { MetricCard } from '@/components/cards/dashboardMetricCards';
import { PieChart, LineChart } from '@/components/charts/dashboardCharts';

const PMIDashboard = () => {
  const { user } = useAuth();
  const { data, loading, error, refetch, getChartDataForYear } = usePMIDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [yearChartData, setYearChartData] = useState<any>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleYearChange = async (year: number) => {
    setSelectedYear(year);
    if (getChartDataForYear) {
      // Always fetch data for selected year to ensure we get full 12 months
      const chartData = await getChartDataForYear(year);
      setYearChartData(chartData);
    } else {
      setYearChartData(null);
    }
  };

  // Auto-fetch current year data on component mount
  useEffect(() => {
    if (data && getChartDataForYear && selectedYear === new Date().getFullYear()) {
      handleYearChange(selectedYear);
    }
  }, [data, getChartDataForYear]);

  if (!user || user.institution_type !== 'pmi') {
    return (
      <ProtectedRoute>
        <div className="text-center py-10">
          <p className="text-red-500">Akses ditolak. Halaman ini hanya untuk PMI.</p>
        </div>
      </ProtectedRoute>
    );
  }

  const dashboardData = data as PMIDashboardData | null;

  // Prepare pie chart data for blood type requests using chart API data
  const pieChartData = (yearChartData?.bloodTypeDistribution || data?.requestsByBloodType || []).map((item: any) => ({
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
              <p className="text-gray-500 text-sm mt-1">Palang Merah Indonesia</p>
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
              {isRefreshing ? 'Menyegarkan…' : 'Muat Ulang'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            <p className="font-medium">Gagal memuat dashboard</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Pemenuhan Darah Aktif"
            value={loading ? '-' : dashboardData?.activeCampaigns || 0}
            subtitle="Pemenuhan Darah berjalan"
            color="blue"
            isLoading={loading}
            variant="neutral"
          />
          <MetricCard
            title="Permintaan Berjalan"
            value={loading ? '-' : dashboardData?.runningRequests || 0}
            subtitle="permintaan menunggu"
            color="yellow"
            isLoading={loading}
            variant="neutral"
          />
          <MetricCard
            title="Permintaan Selesai"
            value={loading ? '-' : dashboardData?.completedRequests || 0}
            subtitle="permintaan terpenuhi"
            color="green"
            isLoading={loading}
            variant="neutral"
          />
          <MetricCard
            title="Tingkat Pemenuhan"
            value={loading ? '-' : `${dashboardData?.fulfillmentRate || 0}%`}
            subtitle="tingkat pemenuhan"
            color="purple"
            isLoading={loading}
            variant="neutral"
          />
        </div>

        {/* Stok Darah - Tabel */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stok Darah Lengkap</h3>
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
                      Memuat...
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
                            MENDESAK
                          </span>
                        ) : stock.quantity < 5 ? (
                          <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                            RENDAH
                          </span>
                        ) : (
                          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                            NORMAL
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-700 text-xs">
                        {stock.quantity === 0 ? 'Butuh order pendonor segera' : 
                         stock.quantity < 5 ? 'Monitor, siapkan order pendonor' : 
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
              title="Permintaan per Golongan Darah"
              data={pieChartData}
              isLoading={loading}
              selectedYear={selectedYear}
              availableYears={data?.availableYears || []}
              onYearChange={handleYearChange}
            />
          </div>

          {/* Tren Permintaan 12 Bulan - Line Chart */}
          <div className="h-fit">
            <LineChart
              title="Tren Permintaan per Bulan"
              data={yearChartData?.monthlyTrends || data?.requestsTrend || []}
              isLoading={loading}
              selectedYear={selectedYear}
              availableYears={data?.availableYears || []}
              onYearChange={handleYearChange}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default PMIDashboard;
