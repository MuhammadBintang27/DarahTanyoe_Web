'use client';

import { useState } from 'react';
import { useAuth } from '@/context/authContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, Check, CheckCheck, Search, AlertCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/protectedRoute/protectedRoute';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const institutionId = user?.institution_id || user?.id;
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ institutionId: institutionId || '' });

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread' && n.is_read) return false;
    if (searchQuery && 
        !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !n.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'request':
        return '🩸';
      case 'donation':
        return '💉';
      case 'pickup':
        return '📦';
      case 'stock':
        return '📊';
      case 'campaign':
        return '📢';
      default:
        return '📬';
    }
  };

  if (!institutionId) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col gap-6 p-6">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
            <p className="text-gray-600">Silakan login terlebih dahulu</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-3xl text-white">Notifikasi</h2>
            <p className="text-sm text-white/80 mt-1">
              {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CheckCheck className="w-5 h-5" />
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Box */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari notifikasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg pl-12 pr-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
          </div>

          {/* Reset Filter Button */}
          {searchQuery && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <X size={14} />
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-2 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Semua ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'unread'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Belum Dibaca ({unreadCount})
          </button>
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat notifikasi...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold text-lg mb-2">Gagal memuat notifikasi</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Bell size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {filter === 'unread' ? 'Tidak ada notifikasi belum dibaca' : 'Belum ada notifikasi'}
            </p>
            <p className="text-gray-400 text-sm">
              {filter === 'unread' 
                ? 'Semua notifikasi sudah dibaca' 
                : 'Notifikasi akan muncul di sini ketika ada aktivitas baru'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-lg border-l-4 ${getPriorityColor(notification.priority)} p-6 transition-all hover:shadow-xl cursor-pointer`}
                onClick={() => {
                  if (notification.action_url) {
                    router.push(notification.action_url);
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-white border-2 border-gray-200 shadow-sm">
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className={`text-lg leading-tight ${!notification.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></div>
                          <span className="text-xs font-bold text-primary bg-red-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                            Baru
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-gray-500 font-medium">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </span>

                      {notification.priority === 'critical' && (
                        <span className="px-2.5 py-1 text-xs font-bold text-red-700 bg-red-100 rounded-full">
                          🔴 Urgent
                        </span>
                      )}
                      {notification.priority === 'high' && (
                        <span className="px-2.5 py-1 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full">
                          Penting
                        </span>
                      )}

                      {notification.action_label && (
                        <span className="text-xs font-semibold text-primary">
                          {notification.action_label} →
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mark as read button */}
                  {!notification.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="flex-shrink-0 p-3 text-gray-400 hover:text-white hover:bg-primary rounded-xl transition-all shadow-sm border-2 border-gray-200 hover:border-primary"
                      title="Tandai sudah dibaca"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
