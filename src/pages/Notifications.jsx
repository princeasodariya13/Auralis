import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { Check, Package, CreditCard, XCircle, Info, ChevronLeft, ChevronRight } from 'lucide-react';

const getIconForType = (type) => {
    switch (type) {
        case 'ORDER_PLACED':
        case 'ORDER_PROCESSING':
        case 'ORDER_SHIPPED':
        case 'ORDER_DELIVERED':
            return <Package size={20} color="var(--color-indigo)" />;
        case 'PAYMENT_SUCCESS':
            return <Check size={20} color="#22c55e" />;
        case 'PAYMENT_FAILED':
            return <CreditCard size={20} color="#ef4444" />;
        case 'ORDER_CANCELLED':
            return <XCircle size={20} color="#ef4444" />;
        default:
            return <Info size={20} color="var(--color-slate-400)" />;
    }
};

const Notifications = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const { 
        notifications, 
        pagination, 
        loading, 
        error, 
        markAsRead, 
        markAllAsRead 
    } = useNotifications(page);

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }
        if (notification.orderNumber) {
            navigate(`/orders/${notification.orderNumber}`);
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="section container" style={{ minHeight: '60vh' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-lg) 0' }}>
                    <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--spacing-xl)' }}>Notifications</h1>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ 
                                height: '80px', 
                                backgroundColor: 'rgba(255,255,255,0.02)', 
                                borderRadius: 'var(--radius-md)' 
                            }}></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error && notifications.length === 0) {
        return (
            <div className="section container" style={{ minHeight: '60vh' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-lg) 0', textAlign: 'center' }}>
                    <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--spacing-md)' }}>Notifications</h1>
                    <p style={{ color: '#ef4444' }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="section container" style={{ minHeight: '60vh' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-lg) 0' }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-xl)',
                    paddingBottom: 'var(--spacing-md)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <h1 style={{ fontSize: 'var(--font-size-3xl)' }}>Notifications</h1>
                    
                    {notifications.some(n => !n.isRead) && (
                        <button 
                            onClick={markAllAsRead}
                            className="btn btn-outline btn-sm"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '4rem 1rem',
                        backgroundColor: 'rgba(255,255,255,0.01)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgba(255,255,255,0.03)'
                    }}>
                        <Info size={48} color="var(--color-slate-500)" style={{ margin: '0 auto 1rem auto' }} />
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-slate-300)' }}>You're all caught up</h2>
                        <p style={{ color: 'var(--color-slate-400)' }}>You have no new notifications right now.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {notifications.map((notification) => (
                            <div 
                                key={notification._id}
                                onClick={() => handleNotificationClick(notification)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '1rem',
                                    padding: '1rem',
                                    backgroundColor: notification.isRead ? 'rgba(255,255,255,0.01)' : 'rgba(79, 70, 229, 0.05)',
                                    borderRadius: 'var(--radius-md)',
                                    border: `1px solid ${notification.isRead ? 'rgba(255,255,255,0.03)' : 'rgba(79, 70, 229, 0.2)'}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {!notification.isRead && (
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '3px',
                                        backgroundColor: 'var(--color-indigo)'
                                    }}></div>
                                )}
                                
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {getIconForType(notification.type)}
                                </div>
                                
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                        <h3 style={{ 
                                            fontSize: '1rem', 
                                            fontWeight: notification.isRead ? 'normal' : '600',
                                            color: 'var(--color-white)',
                                            margin: 0
                                        }}>
                                            {notification.title}
                                        </h3>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', whiteSpace: 'nowrap' }}>
                                            {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p style={{ 
                                        margin: 0, 
                                        color: notification.isRead ? 'var(--color-slate-400)' : 'var(--color-slate-300)',
                                        fontSize: '0.875rem',
                                        lineHeight: 1.5
                                    }}>
                                        {notification.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        gap: '1rem',
                        marginTop: '2rem'
                    }}>
                        <button 
                            className="btn btn-outline btn-sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-slate-400)' }}>
                            Page {page} of {pagination.totalPages}
                        </span>
                        <button 
                            className="btn btn-outline btn-sm"
                            disabled={page === pagination.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
