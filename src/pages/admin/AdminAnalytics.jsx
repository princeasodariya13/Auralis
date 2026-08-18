import { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';
import { TrendingUp, Users, ShoppingCart, DollarSign, AlertTriangle, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import './AdminAnalytics.css';

const AdminAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('30d');

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const responseData = await adminService.getAnalytics(timeRange);
                setData(responseData);
                setError(null);
            } catch (err) {
                setError(err.error?.message || 'Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [timeRange]);

    if (error) {
        return (
            <div className="admin-dashboard-error">
                <AlertTriangle size={48} color="#ef4444" />
                <h2>Analytics Error</h2>
                <p>{error}</p>
                <button className="btn btn-primary mt-4" onClick={() => window.location.reload()}>
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="admin-analytics">
            <header className="dashboard-header split-header">
                <div>
                    <h1>Business Analytics</h1>
                    <p className="text-muted">Authoritative metrics for your Auralis store.</p>
                </div>
                <div className="analytics-controls">
                    <div className="time-range-selector">
                        <Calendar size={18} />
                        <select 
                            value={timeRange} 
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="form-control"
                            disabled={loading}
                        >
                            <option value="today">Today</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="year">This Year</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="admin-dashboard-loading mt-4">
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
            ) : (
                <>
                    {/* Revenue & Growth Metrics */}
                    <div className="admin-metrics-grid mb-8">
                        <div className="admin-metric-card highlight">
                            <div className="metric-header">
                                <h3 className="metric-title">Total Revenue</h3>
                                <DollarSign className="metric-icon" size={20} />
                            </div>
                            <div className="metric-value">${data.revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                            <div className="metric-subtext text-muted">
                                Confirmed paid orders only
                            </div>
                        </div>

                        <div className="admin-metric-card">
                            <div className="metric-header">
                                <h3 className="metric-title">Total Orders</h3>
                                <ShoppingCart className="metric-icon" size={20} />
                            </div>
                            <div className="metric-value">{data.orders.total}</div>
                            <div className="metric-subtext text-muted">
                                Avg. Order: ${data.orders.avgOrderValue.toLocaleString(undefined, {maximumFractionDigits: 2})}
                            </div>
                        </div>

                        <div className="admin-metric-card">
                            <div className="metric-header">
                                <h3 className="metric-title">Total Discounts</h3>
                                <TagIcon className="metric-icon" size={20} />
                            </div>
                            <div className="metric-value">${data.discounts.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                            <div className="metric-subtext text-muted">
                                Granted via coupons
                            </div>
                        </div>

                        <div className="admin-metric-card">
                            <div className="metric-header">
                                <h3 className="metric-title">New Customers</h3>
                                <Users className="metric-icon" size={20} />
                            </div>
                            <div className="metric-value">{data.customers.new}</div>
                            <div className="metric-subtext text-muted">
                                Out of {data.customers.total} total accounts
                            </div>
                        </div>
                    </div>

                    <div className="admin-panel mb-8">
                        <div className="panel-header">
                            <h2>Conversion Funnel</h2>
                        </div>
                        <div className="panel-body">
                            {data.funnel ? (
                                <div className="funnel-visualization">
                                    <div className="funnel-stage">
                                        <div className="funnel-bar" style={{ width: '100%', backgroundColor: 'var(--color-slate-700)' }}>
                                            <span className="funnel-label">Product Views</span>
                                            <span className="funnel-value">{data.funnel.productViews}</span>
                                        </div>
                                    </div>
                                    <div className="funnel-stage">
                                        <div className="funnel-bar" style={{ width: data.funnel.productViews > 0 ? `${Math.max(5, (data.funnel.addToCart / data.funnel.productViews) * 100)}%` : '0%', backgroundColor: 'var(--color-primary)' }}>
                                            <span className="funnel-label">Added to Cart</span>
                                            <span className="funnel-value">{data.funnel.addToCart}</span>
                                        </div>
                                        {data.funnel.productViews > 0 && <span className="funnel-conversion text-muted text-sm">{((data.funnel.addToCart / data.funnel.productViews) * 100).toFixed(1)}%</span>}
                                    </div>
                                    <div className="funnel-stage">
                                        <div className="funnel-bar" style={{ width: data.funnel.productViews > 0 ? `${Math.max(5, (data.funnel.checkoutStarted / data.funnel.productViews) * 100)}%` : '0%', backgroundColor: 'var(--color-primary)' }}>
                                            <span className="funnel-label">Checkout Started</span>
                                            <span className="funnel-value">{data.funnel.checkoutStarted}</span>
                                        </div>
                                        {data.funnel.addToCart > 0 && <span className="funnel-conversion text-muted text-sm">{((data.funnel.checkoutStarted / data.funnel.addToCart) * 100).toFixed(1)}%</span>}
                                    </div>
                                    <div className="funnel-stage">
                                        <div className="funnel-bar" style={{ width: data.funnel.productViews > 0 ? `${Math.max(5, (data.funnel.paymentInitiated / data.funnel.productViews) * 100)}%` : '0%', backgroundColor: 'var(--color-primary)' }}>
                                            <span className="funnel-label">Payment Initiated</span>
                                            <span className="funnel-value">{data.funnel.paymentInitiated}</span>
                                        </div>
                                        {data.funnel.checkoutStarted > 0 && <span className="funnel-conversion text-muted text-sm">{((data.funnel.paymentInitiated / data.funnel.checkoutStarted) * 100).toFixed(1)}%</span>}
                                    </div>
                                    <div className="funnel-stage">
                                        <div className="funnel-bar" style={{ width: data.funnel.productViews > 0 ? `${Math.max(5, (data.funnel.paidOrders / data.funnel.productViews) * 100)}%` : '0%', backgroundColor: 'var(--color-success)' }}>
                                            <span className="funnel-label">Paid Orders</span>
                                            <span className="funnel-value">{data.funnel.paidOrders}</span>
                                        </div>
                                        {data.funnel.paymentInitiated > 0 && <span className="funnel-conversion text-success text-sm font-medium">{((data.funnel.paidOrders / data.funnel.paymentInitiated) * 100).toFixed(1)}%</span>}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted">Funnel data not available.</p>
                            )}
                        </div>
                    </div>

                    <div className="dashboard-columns">
                        {/* Best Sellers */}
                        <div className="dashboard-col main-col">
                            <div className="admin-panel">
                                <div className="panel-header">
                                    <h2>Top Performing Products</h2>
                                </div>
                                <div className="panel-body p-0">
                                    {data.bestSellers && data.bestSellers.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="admin-table">
                                                <thead>
                                                    <tr>
                                                        <th>Product</th>
                                                        <th className="text-right">Units Sold</th>
                                                        <th className="text-right">Est. Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.bestSellers.map(product => (
                                                        <tr key={product._id}>
                                                            <td><strong>{product.name}</strong></td>
                                                            <td className="text-right">{product.quantitySold}</td>
                                                            <td className="text-right">${product.revenue.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="admin-empty-state">
                                            <TrendingUp size={24} className="mb-2 text-muted" />
                                            <p>No fulfilled sales in this period.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Revenue Timeline */}
                            <div className="admin-panel mt-6">
                                <div className="panel-header">
                                    <h2>Revenue Timeline</h2>
                                </div>
                                <div className="panel-body p-0">
                                    {data.revenueOverTime && data.revenueOverTime.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="admin-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th className="text-right">Orders</th>
                                                        <th className="text-right">Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.revenueOverTime.map(item => (
                                                        <tr key={item._id}>
                                                            <td><strong>{item._id}</strong></td>
                                                            <td className="text-right">{item.orders}</td>
                                                            <td className="text-right text-primary font-medium">${item.revenue.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="admin-empty-state">
                                            <Calendar size={24} className="mb-2 text-muted" />
                                            <p>No revenue data for this period.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Side Column: Health & Payment Metrics */}
                        <div className="dashboard-col side-col">
                            {/* Payment Outcomes */}
                            <div className="admin-panel mb-6">
                                <div className="panel-header">
                                    <h2>Payment Pipeline</h2>
                                </div>
                                <div className="panel-body">
                                    <div className="pipeline-stats">
                                        <div className="pipeline-stat">
                                            <div className="pipeline-label">
                                                <CheckCircle size={16} className="text-success" />
                                                <span>Successful</span>
                                            </div>
                                            <div className="pipeline-value">{data.orders.successful}</div>
                                        </div>
                                        <div className="pipeline-stat">
                                            <div className="pipeline-label">
                                                <XCircle size={16} className="text-danger" />
                                                <span>Failed/Abandoned</span>
                                            </div>
                                            <div className="pipeline-value">{data.orders.failed}</div>
                                        </div>
                                        <div className="pipeline-stat">
                                            <div className="pipeline-label">
                                                <Clock size={16} className="text-warning" />
                                                <span>Pending</span>
                                            </div>
                                            <div className="pipeline-value">{data.orders.pending}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Operational Health */}
                            <div className="admin-panel">
                                <div className="panel-header">
                                    <h2>Operational Health</h2>
                                </div>
                                <div className="panel-body">
                                    <ul className="health-list">
                                        <li>
                                            <span className="health-label">Database</span>
                                            <span className={`health-status ${data.health.dbStatus === 'connected' ? 'good' : 'bad'}`}>
                                                {data.health.dbStatus}
                                            </span>
                                        </li>
                                        <li>
                                            <span className="health-label">Environment</span>
                                            <span className="health-status neutral">{data.health.nodeEnv}</span>
                                        </li>
                                        <li>
                                            <span className="health-label">Uptime</span>
                                            <span className="health-status neutral">{data.health.uptime}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// SVG component missing from lucide
function TagIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828z" />
            <circle cx="7.5" cy="7.5" r="1.5" />
        </svg>
    );
}

export default AdminAnalytics;
