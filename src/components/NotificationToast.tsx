"use client";

import { useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';
import { Notification } from '@/hooks/useNotifications';

interface NotificationToastProps {
  institutionId: string;
}

const NotificationToast = ({ institutionId }: NotificationToastProps) => {
  const lastNotificationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!institutionId) return;

    const channel = supabase
      .channel('notification-toast')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `institution_id=eq.${institutionId}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          
          // Prevent duplicate toasts
          if (lastNotificationIdRef.current === notification.id) return;
          lastNotificationIdRef.current = notification.id;

          // Show toast based on priority
          const toastOptions = {
            duration: notification.priority === 'critical' ? 10000 : 5000,
          };

          switch (notification.priority) {
            case 'critical':
              toast.error(notification.title, {
                description: notification.message,
                ...toastOptions,
              });
              break;
            case 'high':
              toast.warning(notification.title, {
                description: notification.message,
                ...toastOptions,
              });
              break;
            default:
              toast.info(notification.title, {
                description: notification.message,
                ...toastOptions,
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [institutionId]);

  return null;
};

export default NotificationToast;
