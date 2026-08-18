import { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';
import { Users, Package, ShoppingCart, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const responseData = await adminService.getDashboard();
                setData(responseData);
                setError(null);
            } catch (err) {
                setError(err.error?.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="admin-dashboard-loading">
                <div className="admin-header-skeleton"></div>
                <div className="admin-metrics-grid">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="admin-metric-card skeleton">
                            <div className="skeleton-icon"></div>
                            <div className="skeleton-text short"></div>
                            <div className="skeleton-text long"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-dashboard-error">
                <AlertTriangle size={48} color="#ef4444" />
                <h2>Dashboard Error</h2>
                <p>{error}</p>
                <button className="btn btn-primary mt-4" onClick={() => window.location.reload()}>
                    Retry Connection
                </button>
            </div>
        );
    }

    const { customers, products, orders, recentOrders, lowStockProducts } = data;

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header">
                <h1>Overview</h1>
                <p className="text-muted">Welcome back. Here's what's happening today.</p>
            </header>

            {/* Top Metrics */}
            <div className="admin-metrics-grid mb-8">
                <div className="admin-metric-card">
                    <div className="metric-header">
                        <h3 className="metric-title">Total Orders</h3>
                        <ShoppingCart className="metric-icon" size={20} />
                    </div>
                    <div className="metric-value">{orders.total}</div>
                    <div className="metric-subtext text-muted">
                        <span className="text-primary">{orders.todaysOrders}</span> today
                    </div>
                </div>

                <div className="admin-metric-card">
                    <div className="metric-header">
                        <h3 className="metric-title">Order Value</h3>
                        <DollarSign className="metric-icon" size={20} />
                    </div>
                    <div className="metric-value">${orders.totalOrderValue.toLocaleString()}</div>
                    <div className="metric-subtext text-muted">
                        Avg: ${(orders.averageOrderValue || 0).toLocaleString(undefined, {maximumFractionDigits: 2})}
                    </div>
                </div>

                <div className="admin-metric-card">
                    <div className="metric-header">
                        <h3 className="metric-title">Total Customers</h3>
                        <Users className="metric-icon" size={20} />
                    </div>
                    <div className="metric-value">{customers.total}</div>
                    <div className="metric-subtext text-muted">Active accounts</div>
                </div>

                <div className="admin-metric-card">
                    <div className="metric-header">
                        <h3 className="metric-title">Products</h3>
                        <Package className="metric-icon" size={20} />
                    </div>
                    <div className="metric-value">{products.active}</div>
                    <div className="metric-subtext text-muted">
                        {products.inactive} inactive • {products.outOfStock} out of stock
                    </div>
                </div>
            </div>

            <div className="dashboard-columns">
                {/* Recent Orders */}
                <div className="dashboard-col main-col">
                    <div className="admin-panel">
                        <div className="panel-header">
                            <h2>Recent Orders</h2>
                            <button className="btn-text">View All</button>
                        </div>
                        <div className="panel-body p-0">
                            {recentOrders && recentOrders.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Order #</th>
                                                <th>Customer</th>
                                                <th>Date</th>
                                                <th>Total</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentOrders.map(order => (
                                                <tr key={order.orderNumber}>
                                                    <td><strong>{order.orderNumber}</strong></td>
                                                    <td>{order.customerName}</td>
                                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                                    <td>${order.total.toLocaleString()}</td>
                                                    <td>
                                                        <span className={`status-badge status-${order.status}`}>
                                                            {order.status.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="admin-empty-state">
                                    <p>No recent orders found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="dashboard-col side-col">
                    <div className="admin-panel border-warning">
                        <div className="panel-header">
                            <h2>Inventory Alerts</h2>
                            <span className="badge-warning">{products.lowStock + products.outOfStock}</span>
                        </div>
                        <div className="panel-body">
                            {lowStockProducts && lowStockProducts.length > 0 ? (
                                <div className="low-stock-list">
                                    {lowStockProducts.map(product => (
                                        <div key={product.sku} className="low-stock-item">
                                            <div className="ls-img-wrap">
                                                <img src={product.image} alt={product.name} />
                                            </div>
                                            <div className="ls-info">
                                                <h4>{product.name}</h4>
                                                <span className="ls-sku">{product.sku}</span>
                                            </div>
                                            <div className={`ls-qty ${product.stockQuantity === 0 ? 'out' : 'low'}`}>
                                                {product.stockQuantity}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="admin-empty-state small">
                                    <TrendingUp size={24} className="mb-2 text-muted" />
                                    <p>Inventory is healthy.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
