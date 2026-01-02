"use client";

import { useNotif } from "@/context/notifContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Check, CheckCheck, X, Bell, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface NotificationBellProps {
  institutionId: string;
}

const NotificationBell = ({ institutionId }: NotificationBellProps) => {
  const { isShowNotif, toggleNotif, closeNotif } = useNotif();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ institutionId });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isShowNotif) {
          closeNotif();
        }
      }
    };

    if (isShowNotif) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShowNotif, closeNotif]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500';
      case 'high':
        return 'border-orange-500';
      case 'medium':
        return 'border-blue-500';
      default:
        return 'border-gray-500';
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

  return (
    <div className="relative">
      {/* Bell Button */}
      <button 
        onClick={toggleNotif} 
        className="relative cursor-pointer hover:scale-105 duration-200"
      >
        <Bell className="w-6 h-6 text-[#AB4545] fill-[#AB4545]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isShowNotif && (
        <div 
          ref={dropdownRef}
          className="bg-white w-[420px] max-h-[calc(100vh-100px)] rounded-xl shadow-2xl border border-gray-200 absolute top-12 right-0 z-50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Bell className="w-5 h-5 text-[#AB4545]" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Notifikasi</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-600">{unreadCount} belum dibaca</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={async () => {
                    await markAllAsRead();
                  }}
                  className="px-3 py-1.5 text-xs text-white bg-[#AB4545] hover:bg-[#8B3535] rounded-lg font-medium flex items-center gap-1 transition-colors shadow-sm"
                  title="Tandai semua sudah dibaca"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tandai Semua
                </button>
              )}
              <button
                onClick={closeNotif}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 bg-gray-50">
            {!institutionId ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mb-3 text-yellow-500" />
                <p className="text-sm font-medium">User belum login</p>
                <p className="text-xs text-gray-400 mt-1">Silakan login terlebih dahulu</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#AB4545] border-t-transparent"></div>
                <p className="mt-3 text-sm text-gray-500">Memuat notifikasi...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-8 text-red-500">
                <AlertCircle className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium">Gagal memuat notifikasi</p>
                <p className="text-xs text-gray-500 mt-1">{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                  <Bell className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-sm font-medium">Belum ada notifikasi</p>
                <p className="text-xs text-gray-400 mt-1">Notifikasi akan muncul di sini</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-all cursor-pointer hover:shadow-md ${
                      !notification.is_read 
                        ? 'bg-white border-l-4 ' + getPriorityColor(notification.priority)
                        : 'bg-gray-50/50 border-l-4 border-transparent'
                    }`}
                    onClick={() => {
                      if (notification.action_url) {
                        router.push(notification.action_url);
                        closeNotif();
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm bg-white border-2 border-gray-200">
                        {getTypeIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`text-sm leading-tight ${!notification.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2.5 h-2.5 bg-[#AB4545] rounded-full flex-shrink-0 mt-0.5 animate-pulse"></div>
                          )}
                        </div>
                        
                        <p className={`text-xs leading-relaxed ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                          {notification.message}
                        </p>
                        
                        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-400 font-medium">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: idLocale,
                            })}
                          </span>
                          
                          {notification.priority === 'critical' && (
                            <span className="px-2 py-0.5 text-xs font-bold text-red-700 bg-red-100 rounded-full">
                              🔴 Urgent
                            </span>
                          )}
                          {notification.priority === 'high' && (
                            <span className="px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
                              Penting
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
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-[#AB4545] rounded-lg transition-all shadow-sm"
                          title="Tandai sudah dibaca"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
              <button
                onClick={() => {
                  router.push('/notifications');
                  closeNotif();
                }}
                className="w-full text-sm text-[#AB4545] hover:text-[#8B3535] font-semibold text-center hover:underline transition-colors"
              >
                Lihat Semua Notifikasi →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
