import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
  isLoading?: boolean;
  onClick?: () => void;
  /**
   * Visual style of the card
   * - 'tinted': light tinted background (default, backward compatible)
   * - 'neutral': white card with subtle border (matches dashboard screenshot)
   */
  variant?: 'tinted' | 'neutral';
}

const bgColors = {
  blue: 'bg-blue-50 border-blue-200',
  red: 'bg-red-50 border-red-200',
  green: 'bg-green-50 border-green-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  purple: 'bg-purple-50 border-purple-200',
};

const iconBgColors = {
  blue: 'bg-blue-100 text-blue-600',
  red: 'bg-red-100 text-red-600',
  green: 'bg-green-100 text-green-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  purple: 'bg-purple-100 text-purple-600',
};

const titleColors = {
  blue: 'text-blue-700',
  red: 'text-red-700',
  green: 'text-green-700',
  yellow: 'text-yellow-700',
  purple: 'text-purple-700',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  isLoading = false,
  onClick,
  variant = 'tinted',
}) => {
  return (
    <div
      className={`
        w-full h-28 rounded-xl border 
        transition-all hover:shadow-md
        ${variant === 'tinted' ? bgColors[color] : 'bg-white border-gray-200'}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      <div className="h-full flex flex-col justify-between p-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h3 className={`text-xs font-semibold ${variant === 'tinted' ? titleColors[color] : 'text-gray-600'}`}>{title}</h3>
          {icon && (
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${variant === 'tinted' ? iconBgColors[color] : 'bg-gray-100 text-gray-600'}`}>
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-7 bg-gray-200 rounded w-28 animate-pulse"></div>
              <div className="h-3.5 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              {subtitle && <p className="text-[11px] text-gray-500 mt-1">{subtitle}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface DetailListCardProps {
  title: string;
  items: {
    label: string;
    value: string | number;
    color?: string;
  }[];
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const DetailListCard: React.FC<DetailListCardProps> = ({
  title,
  items,
  icon,
  isLoading = false,
}) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {icon && <div className="text-2xl">{icon}</div>}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : items.length > 0 ? (
          items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
              <span className="text-sm text-gray-700">{item.label}</span>
              <span className={`font-semibold ${item.color || 'text-gray-900'}`}>
                {item.value}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No data available</p>
        )}
      </div>
    </div>
  );
};

interface AlertCardProps {
  title: string;
  items: {
    label: string;
    status: 'critical' | 'warning' | 'info';
    message: string;
  }[];
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const alertColors = {
  critical: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
};

const alertBadgeColors = {
  critical: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
};

export const AlertCard: React.FC<AlertCardProps> = ({
  title,
  items,
  icon,
  isLoading = false,
}) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {icon && <div className="text-2xl">{icon}</div>}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : items.length > 0 ? (
          items.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-lg border p-3 ${alertColors[item.status]}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs mt-1 opacity-90">{item.message}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${alertBadgeColors[item.status]}`}
                >
                  {item.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No alerts</p>
        )}
      </div>
    </div>
  );
};
