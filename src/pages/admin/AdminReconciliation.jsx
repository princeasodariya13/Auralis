import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';
import { AlertCircle, FileText, CheckCircle, Search, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, XCircle, FileWarning } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../assets/AdminReconciliation.css';

const AdminReconciliation = () => {
    const [summary, setSummary] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
    const [filters, setFilters] = useState({
        severity: 'ALL',
        type: 'ALL'
    });

    const fetchReconciliationData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [summaryData, anomaliesData] = await Promise.all([
                adminService.getReconciliationSummary(),
                adminService.getReconciliationAnomalies({
                    page: pagination.page,
                    limit: pagination.limit,
                    severity: filters.severity,
                    type: filters.type
                })
            ]);
            
            setSummary(summaryData);
            setAnomalies(anomaliesData.anomalies);
            setPagination(prev => ({
                ...prev,
                totalPages: anomaliesData.pagination.pages,
                total: anomaliesData.pagination.total
            }));
            
        } catch (err) {
            setError(err.message || 'Failed to load reconciliation data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReconciliationData();
        // eslint-disable-next-line
    }, [pagination.page, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'CRITICAL':
                return <span className="badge badge-critical"><XCircle size={14} /> CRITICAL</span>;
            case 'HIGH':
                return <span className="badge badge-high"><AlertTriangle size={14} /> HIGH</span>;
            case 'WARNING':
                return <span className="badge badge-warning"><FileWarning size={14} /> WARNING</span>;
            default:
                return <span className="badge badge-info"><AlertCircle size={14} /> INFO</span>;
        }
    };

    if (loading && !summary) {
        return (
            <div className="admin-loading">
                <RefreshCw className="spinner" size={32} />
                <p>Analyzing financial integrity...</p>
            </div>
        );
    }

    if (error && !summary) {
        return (
            <div className="admin-error">
                <AlertCircle size={48} />
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={fetchReconciliationData} className="btn-primary">Try Again</button>
            </div>
        );
    }

    return (
        <div className="admin-reconciliation">
            <div className="admin-header">
                <div>
                    <h1>Financial Reconciliation</h1>
                    <p>Diagnostic tools to verify order, payment, and refund integrity.</p>
                </div>
                <button onClick={fetchReconciliationData} className="btn-secondary" disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spinner' : ''} />
                    Run Audit
                </button>
            </div>

            {summary && (
                <div className="reconciliation-summary">
                    <div className="summary-card">
                        <div className="summary-icon"><FileText size={24} /></div>
                        <div className="summary-info">
                            <h3>{summary.totalOrders}</h3>
                            <p>Total Orders</p>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon check"><CheckCircle size={24} /></div>
                        <div className="summary-info">
                            <h3>{summary.paidOrders}</h3>
                            <p>Paid Orders</p>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon warning"><AlertTriangle size={24} /></div>
                        <div className="summary-info">
                            <h3>₹{summary.totalRefunded.toFixed(2)}</h3>
                            <p>Total Refunded</p>
                        </div>
                    </div>
                    <div className="summary-card critical-alert">
                        <div className="summary-icon"><XCircle size={24} /></div>
                        <div className="summary-info">
                            <h3>{summary.criticalIssues}</h3>
                            <p>Critical Anomalies</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-filters">
                <div className="filter-group">
                    <label>Severity</label>
                    <select name="severity" value={filters.severity} onChange={handleFilterChange}>
                        <option value="ALL">All Severities</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="WARNING">Warning</option>
                        <option value="INFO">Info</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Anomaly Type</label>
                    <select name="type" value={filters.type} onChange={handleFilterChange}>
                        <option value="ALL">All Types</option>
                        <option value="PAID_ORDER_MISSING_PAYMENT_REFERENCE">Missing Payment Ref</option>
                        <option value="REFUND_WITHOUT_GATEWAY_REFERENCE">Missing Refund Ref</option>
                        <option value="OVER_REFUND">Over Refunded</option>
                        <option value="INVALID_RETURN_STATE">Invalid Return State</option>
                        <option value="INVENTORY_NEGATIVE">Negative Inventory</option>
                    </select>
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Severity</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Reference</th>
                            <th>Date Detected</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {anomalies.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="table-empty">
                                    <CheckCircle size={48} />
                                    <p>No financial anomalies detected for these filters.</p>
                                </td>
                            </tr>
                        ) : (
                            anomalies.map((ano) => (
                                <tr key={ano._id}>
                                    <td>{getSeverityBadge(ano.severity)}</td>
                                    <td><span className="anomaly-type">{ano.type}</span></td>
                                    <td className="anomaly-desc">{ano.message}</td>
                                    <td>
                                        {ano.orderNumber && ano.orderNumber !== 'N/A' ? (
                                            <Link to={`/admin/orders/${ano.orderNumber}`} className="text-link">
                                                {ano.orderNumber}
                                            </Link>
                                        ) : (
                                            <span className="text-muted">{ano.relatedId.substring(0, 8)}...</span>
                                        )}
                                    </td>
                                    <td>{new Date(ano.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        {ano.relatedModel === 'Order' && (
                                            <Link to={`/admin/orders/${ano.orderNumber}`} className="btn-sm btn-secondary">
                                                View Order
                                            </Link>
                                        )}
                                        {ano.relatedModel === 'ReturnRequest' && (
                                            <Link to={`/admin/returns/${ano.relatedId}`} className="btn-sm btn-secondary">
                                                View Return
                                            </Link>
                                        )}
                                        {ano.relatedModel === 'Product' && (
                                            <Link to={`/admin/products`} className="btn-sm btn-secondary">
                                                View Product
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination.totalPages > 1 && (
                <div className="admin-pagination">
                    <button 
                        disabled={pagination.page === 1}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                        <ChevronLeft size={18} /> Previous
                    </button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button 
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                        Next <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminReconciliation;
