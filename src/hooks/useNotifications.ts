'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';

export interface Notification {
  id: string;
  institution_id: string;
  title: string;
  message: string;
  type: 'donation' | 'pickup' | 'stock' | 'campaign' | 'request' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  read_at?: string;
  created_at: string;
  related_id?: string;
  related_type?: string;
  action_url?: string;
  action_label?: string;
  metadata?: any;
}

interface UseNotificationsOptions {
  institutionId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useNotifications = (options: UseNotificationsOptions) => {
  const { institutionId, autoRefresh = true, refreshInterval = 30000 } = options;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    if (!institutionId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setNotifications(data || []);
      
      // Calculate unread count
      const unread = (data || []).filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat notifikasi');
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  // Fetch unread count only (lightweight)
  const fetchUnreadCount = useCallback(async () => {
    if (!institutionId) return;

    try {
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', institutionId)
        .eq('is_read', false);

      if (countError) throw countError;
      setUnreadCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching unread count:', err);
    }
  }, [institutionId]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (updateError) throw updateError;

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!institutionId) return;

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('institution_id', institutionId)
        .eq('is_read', false);

      if (updateError) throw updateError;

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all as read:', err);
    }
  }, [institutionId]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Setup real-time subscription
  useEffect(() => {
    if (!institutionId) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `institution_id=eq.${institutionId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `institution_id=eq.${institutionId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          );
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [institutionId, fetchUnreadCount]);

  // Auto-refresh unread count
  useEffect(() => {
    if (!autoRefresh || !institutionId) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, institutionId, refreshInterval, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};
