import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

export const useNotifications = (page = 1) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = useCallback(() => setRefreshKey(prev => prev + 1), []);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        let isMounted = true;
        
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const data = await notificationService.getNotifications(page, 15);
                if (isMounted) {
                    setNotifications(data.notifications);
                    setPagination(data.pagination);
                    setUnreadCount(data.unreadCount);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchNotifications();

        return () => { isMounted = false; };
    }, [user, page, refreshKey]);

    const markAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark notification as read", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all notifications as read", err);
        }
    };

    return {
        notifications,
        unreadCount,
        pagination,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        refresh
    };
};
