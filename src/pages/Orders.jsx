import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks/useData';
import { ArrowRight, PackageOpen, Calendar, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState, ErrorState } from '../components/States';
import './Orders.css';

const getStatusBadge = (status) => {
    const statusConfig = {
        pending_payment: { label: 'Pending Payment', class: 'status-warning' },
        processing: { label: 'Processing', class: 'status-info' },
        shipped: { label: 'Shipped', class: 'status-primary' },
        delivered: { label: 'Delivered', class: 'status-success' },
        cancelled: { label: 'Cancelled', class: 'status-error' }
    };
    const config = statusConfig[status] || { label: status, class: 'status-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
};

const Orders = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const limit = 10;
    
    const { data, loading, error } = useOrders(page, limit);

    if (loading) {
        return (
            <div className="section container">
                <h1>Order History</h1>
                <div className="orders-loading">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton-order"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="section container">
                <h1 style={{ marginBottom: '2rem' }}>Order History</h1>
                <ErrorState message={error} onRetry={() => window.location.reload()} />
            </div>
        );
    }

    const { orders, pagination } = data || { orders: [], pagination: null };

    if (orders.length === 0 && page === 1) {
        return (
            <div className="section container">
                <h1 style={{ marginBottom: '2rem' }}>Order History</h1>
                <EmptyState 
                    title="No orders yet" 
                    message="Your next great listening experience is waiting." 
                    actionText="Explore Audio Gear" 
                    onAction={() => navigate('/shop')} 
                />
            </div>
        );
    }

    return (
        <div className="section container orders-page">
            <div className="orders-header">
                <h1>Order History</h1>
            </div>

            <div className="orders-list">
                {orders.map(order => (
                    <div key={order._id} className="order-card">
                        <div className="order-card-header">
                            <div className="order-meta">
                                <div className="meta-item">
                                    <span className="meta-label">Order Number</span>
                                    <span className="meta-value">{order.orderNumber}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label"><Calendar size={14} /> Date Placed</span>
                                    <span className="meta-value">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label"><DollarSign size={14} /> Total</span>
                                    <span className="meta-value">₹{order.total.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="order-actions">
                                <button 
                                    className="btn btn-outline btn-sm"
                                    onClick={() => navigate(`/orders/${order.orderNumber}`)}
                                >
                                    View Details <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="order-card-body">
                            <div className="order-status-row">
                                <div className="status-group">
                                    <span className="meta-label">Status</span>
                                    {getStatusBadge(order.orderStatus)}
                                </div>
                                <div className="status-group">
                                    <span className="meta-label">Payment</span>
                                    <span className={`status-badge ${order.paymentStatus === 'paid' ? 'status-success' : 'status-warning'}`}>
                                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                    </span>
                                </div>
                            </div>
                            <div className="order-preview-items">
                                {order.items.slice(0, 3).map((item, index) => (
                                    <div key={index} className="preview-item">
                                        <img src={item.productImage} alt={item.productName} />
                                    </div>
                                ))}
                                {order.items.length > 3 && (
                                    <div className="preview-item more-items">
                                        +{order.items.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {pagination && pagination.pages > 1 && (
                <div className="pagination">
                    <button 
                        className="btn btn-outline btn-sm" 
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <span className="page-info">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button 
                        className="btn btn-outline btn-sm" 
                        disabled={page === pagination.pages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Orders;
