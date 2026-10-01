import { useEffect, useState, useRef } from 'react';
import { Bell, Check, ExternalLink, Package, Tag, Info, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/apiService';
import './NotificationBell.css';

const NotificationBell = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const popoverRef = useRef(null);

    // Fetch unread count & initial notifications
    const fetchNotificationsData = async () => {
        if (!user) {
            setUnreadCount(0);
            setRecentNotifications([]);
            return;
        }

        try {
            const [count, res] = await Promise.all([
                notificationService.getUnreadCount(),
                notificationService.getNotifications({ limit: 4 })
            ]);
            setUnreadCount(count || 0);
            setRecentNotifications(res?.notifications || []);
        } catch (err) {
            console.error('Failed to fetch notification data', err);
        }
    };

    useEffect(() => {
        fetchNotificationsData();
        const interval = setInterval(fetchNotificationsData, 120000);
        return () => clearInterval(interval);
    }, [user]);

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleBellClick = (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }
        setIsOpen(!isOpen);
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setUnreadCount(0);
            setRecentNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'ORDER_STATUS':
                return <Package size={16} className="notif-icon order" />;
            case 'PROMOTION':
                return <Tag size={16} className="notif-icon promo" />;
            default:
                return <Info size={16} className="notif-icon info" />;
        }
    };

    return (
        <div className="notification-bell-wrapper" ref={popoverRef}>
            <button 
                className="icon-btn notif-trigger" 
                onClick={handleBellClick}
                aria-label={`Notifications (${unreadCount} unread)`}
                title="Notifications"
            >
                <Bell size={22} />
                {user && unreadCount > 0 && (
                    <span className="notif-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Quick Notification Dropdown Popover */}
            {user && isOpen && (
                <div className="notif-popover">
                    <div className="notif-popover-header">
                        <div className="notif-header-title">
                            <h3>Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="notif-unread-pill">{unreadCount} new</span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button className="notif-mark-btn" onClick={handleMarkAllRead}>
                                <Check size={14} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notif-popover-body">
                        {recentNotifications.length > 0 ? (
                            recentNotifications.map(n => (
                                <div 
                                    key={n._id || n.id} 
                                    className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                                    onClick={() => {
                                        setIsOpen(false);
                                        navigate('/account/notifications');
                                    }}
                                >
                                    <div className="notif-item-icon">
                                        {getIconForType(n.type)}
                                    </div>
                                    <div className="notif-item-content">
                                        <h4 className="notif-title">{n.title}</h4>
                                        <p className="notif-message">{n.message}</p>
                                    </div>
                                    {!n.isRead && <span className="unread-dot"></span>}
                                </div>
                            ))
                        ) : (
                            <div className="notif-empty">
                                <Bell size={28} className="text-muted" />
                                <p>No notifications yet</p>
                            </div>
                        )}
                    </div>

                    <div className="notif-popover-footer">
                        <Link 
                            to="/account/notifications" 
                            className="notif-view-all-link"
                            onClick={() => setIsOpen(false)}
                        >
                            View All Notifications <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;

