import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/apiService';

const NotificationBell = () => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        let isMounted = true;
        const fetchCount = async () => {
            try {
                const count = await notificationService.getUnreadCount();
                if (isMounted) setUnreadCount(count);
            } catch (err) {
                // Fail silently, don't break the navbar
                console.error('Failed to fetch unread count');
            }
        };

        fetchCount();
        
        // Polling every 2 minutes could be added here if desired,
        // but for a transactional store, loading on mount/navigation is usually sufficient.
        const interval = setInterval(fetchCount, 120000);
        
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [user]);

    if (!user) return null;

    return (
        <Link 
            to="/account/notifications" 
            className="navbar-icon" 
            aria-label={`Notifications (${unreadCount} unread)`}
            style={{ position: 'relative' }}
        >
            <Bell size={24} color="var(--color-slate-300)" />
            {unreadCount > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: 'var(--color-indigo)',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--color-slate-900)'
                }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </Link>
    );
};

export default NotificationBell;
