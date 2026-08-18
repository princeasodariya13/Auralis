import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/apiService';
import { Search, ChevronLeft, ChevronRight, AlertTriangle, FileText } from 'lucide-react';
import './AdminOrders.css';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('All');
    const [paymentStatus, setPaymentStatus] = useState('All');
    const [dateFilter, setDateFilter] = useState('All');

    const fetchOrders = async (pageToFetch = pagination.page) => {
        setLoading(true);
        setError(null);
        try {
            const params = { page: pageToFetch, limit: pagination.limit };
            if (search) params.search = search;
            if (status !== 'All') params.status = status;
            if (paymentStatus !== 'All') params.paymentStatus = paymentStatus;
            if (dateFilter !== 'All') params.dateFilter = dateFilter;

            const data = await adminService.getOrders(params);
            setOrders(data.orders);
            setPagination(data.pagination);
        } catch (err) {
            setError(err.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchOrders(1);
        }, 500);
        return () => clearTimeout(debounce);
    }, [search, status, paymentStatus, dateFilter]);

    const clearFilters = () => {
        setSearch('');
        setStatus('All');
        setPaymentStatus('All');
        setDateFilter('All');
    };

    return (
        <div className="admin-orders-page">
            <header className="page-header">
                <div>
                    <h1>Orders</h1>
                    <p className="text-muted">Manage customer orders and fulfillment.</p>
                </div>
            </header>

            <div className="admin-panel mb-6">
                <div className="filters-bar">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by Order # or Customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="All">All Statuses</option>
                            <option value="pending_payment">Pending Payment</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                            <option value="All">All Payments</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                        </select>

                        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                            <option value="All">All Time</option>
                            <option value="Today">Today</option>
                            <option value="Last 7 Days">Last 7 Days</option>
                            <option value="Last 30 Days">Last 30 Days</option>
                        </select>

                        {(search || status !== 'All' || paymentStatus !== 'All' || dateFilter !== 'All') && (
                            <button className="btn-text text-muted text-sm" onClick={clearFilters}>
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="panel-body p-0">
                    {loading ? (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order #</th>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan="7"><div className="skeleton-row"></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : error ? (
                        <div className="admin-empty-state">
                            <AlertTriangle size={32} color="#dc2626" className="mb-2" />
                            <p className="text-danger">{error}</p>
                            <button className="btn btn-outline mt-4" onClick={() => fetchOrders(1)}>Retry</button>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="admin-empty-state">
                            <FileText size={48} className="mb-3 text-muted opacity-50" />
                            <h3>No orders found</h3>
                            <p className="text-muted">Try adjusting your search or filters.</p>
                            <button className="btn btn-outline mt-4" onClick={clearFilters}>Clear Filters</button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order #</th>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.orderNumber}>
                                            <td>
                                                <Link to={`/admin/orders/${order.orderNumber}`} className="font-medium text-primary">
                                                    {order.orderNumber}
                                                </Link>
                                            </td>
                                            <td>
                                                <div className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</div>
                                                <div className="text-xs text-muted">{new Date(order.createdAt).toLocaleTimeString()}</div>
                                            </td>
                                            <td>
                                                <div>{order.customerName}</div>
                                                <div className="text-xs text-muted">{order.customerEmail}</div>
                                            </td>
                                            <td>
                                                <strong>${order.total.toFixed(2)}</strong>
                                                <div className="text-xs text-muted">{order.itemsCount} item(s)</div>
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${order.paymentStatus.toLowerCase()}`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${order.orderStatus.toLowerCase()}`}>
                                                    {order.orderStatus.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <Link to={`/admin/orders/${order.orderNumber}`} className="btn btn-sm btn-outline">
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {!loading && !error && pagination.totalPages > 1 && (
                    <div className="panel-footer pagination-controls">
                        <span className="pagination-info">
                            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                        </span>
                        <div className="pagination-buttons">
                            <button 
                                className="btn-pagination" 
                                disabled={pagination.page <= 1}
                                onClick={() => fetchOrders(pagination.page - 1)}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="pagination-current">Page {pagination.page} of {pagination.totalPages}</span>
                            <button 
                                className="btn-pagination" 
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchOrders(pagination.page + 1)}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
