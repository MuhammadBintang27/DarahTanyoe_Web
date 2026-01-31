'use client';

import React, { useState } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  title: string;
  isLoading?: boolean;
}

const CHART_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#0ea5e9', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
];

// Custom Tooltip untuk Pie Chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
        <p className="font-semibold text-sm">{entry.name}</p>
        <p className="text-sm">
          Jumlah: <span className="font-bold text-blue-300">{entry.value}</span>
        </p>
        <p className="text-xs text-gray-300">
          {entry.percent ? `${(entry.percent * 100).toFixed(1)}%` : ''}
        </p>
      </div>
    );
  }
  return null;
};

// Custom Label untuk Pie Chart
const renderCustomLabel = (entry: any) => {
  const RADIAN = Math.PI / 180;
  const radius = entry.cx + entry.outerRadius;
  const x = entry.cx + radius * Math.cos(-entry.midAngle * RADIAN);
  const y = entry.cy + radius * Math.sin(-entry.midAngle * RADIAN);

  const percent = entry.percent || 0;

  if (percent < 0.05) return null; // Don't show label for small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > entry.cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="font-bold"
      fontSize={12}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const PieChart: React.FC<PieChartProps> = ({ data, title, isLoading = false }) => {
  // Transform data untuk Recharts format
  const chartData = data.map((item, idx) => ({
    name: item.label.replace('Darah ', ''),
    value: item.value,
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }));

  // Ensure all blood types are shown in legend (including 0)
  const allBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const completeData = allBloodTypes.map((type, idx) => {
    const existing = chartData.find(d => d.name === type);
    return existing || {
      name: type,
      value: 0,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    };
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="w-full h-80 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-xs text-gray-500 mb-4">Hover ke slice untuk melihat detail</p>

      {chartData.length === 0 ? (
        <div className="w-full h-80 flex items-center justify-center text-gray-500">
          <p>No data available</p>
        </div>
      ) : (
        <div className="w-full">
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={chartData.filter(d => d.value > 0)} // Only show slices with data
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>

              <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            </RechartsPieChart>
          </ResponsiveContainer>

          {/* Show all blood types in legend even with 0 */}
          <div className="mt-6 grid grid-cols-4 gap-2">
            {allBloodTypes.map((type, idx) => {
              const item = chartData.find(d => d.name === type);
              const value = item?.value || 0;
              return (
                <div
                  key={type}
                  className="p-3 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <span className="font-semibold text-gray-900">{type}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-lg text-gray-900">{value}</span>
                    <span className="text-xs text-gray-500 ml-1">permintaan</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Tooltip untuk Line Chart
const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-sm">
          Permintaan: <span className="font-bold text-blue-300">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

interface LineChartData {
  month: string;
  count: number;
}

interface LineChartProps {
  data: LineChartData[];
  title: string;
  isLoading?: boolean;
  onYearChange?: (year: number) => void;
  selectedYear?: number;
  availableYears?: number[];
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  isLoading = false,
  onYearChange,
  selectedYear,
  availableYears = [],
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="w-full h-80 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {availableYears.length > 0 && onYearChange && (
          <select
            value={selectedYear || new Date().getFullYear()}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                Tahun {year}
              </option>
            ))}
          </select>
        )}
      </div>

      {data.length === 0 ? (
        <div className="w-full h-80 flex items-center justify-center text-gray-500">
          <p>No data available</p>
        </div>
      ) : (
        <div className="w-full">
          <ResponsiveContainer width="100%" height={280}>
            <RechartsLineChart
              data={data}
              margin={{ top: 10, right: 30, left: -20, bottom: 40 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
                style={{ opacity: 0.3 }}
              />
              <XAxis
                dataKey="month"
                stroke="#666"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis
                stroke="#666"
                style={{ fontSize: '12px' }}
                label={{
                  value: 'Jumlah Permintaan',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 5,
                  style: { fontSize: '12px', fill: '#666' },
                }}
              />
              <Tooltip content={<CustomLineTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={{ fill: '#0ea5e9', r: 5 }}
                activeDot={{ r: 7, fill: '#0284c7' }}
                isAnimationActive={true}
                animationDuration={800}
                name="Permintaan"
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        💡 Hover ke data point untuk melihat detail permintaan per bulan
      </p>
    </div>
  );
};
