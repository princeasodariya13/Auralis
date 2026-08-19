import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/apiService';
import { Eye, Search } from 'lucide-react';
import './AdminOrders.css'; // Reuse table styles

const AdminReturns = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });

    const fetchReturns = async (page = 1) => {
        setLoading(true);
        try {
            const data = await adminService.getReturns({ status: statusFilter, page, limit: 10 });
            setReturns(data.returns);
            setPagination(data.pagination);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns(1);
    }, [statusFilter]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchReturns(newPage);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'requested': return <span className="status-badge warning">Requested</span>;
            case 'approved': return <span className="status-badge info">Approved</span>;
            case 'received': return <span className="status-badge primary">Received</span>;
            case 'refund_pending': return <span className="status-badge warning">Refund Pending</span>;
            case 'refunded': return <span className="status-badge success">Refunded</span>;
            case 'rejected': return <span className="status-badge danger">Rejected</span>;
            case 'cancelled': return <span className="status-badge default">Cancelled</span>;
            default: return <span className="status-badge default">{status}</span>;
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1 className="admin-title">Return Requests</h1>
            </div>

            <div className="admin-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="admin-select"
                    style={{ minWidth: '200px' }}
                >
                    <option value="All">All Statuses</option>
                    <option value="requested">Requested</option>
                    <option value="approved">Approved</option>
                    <option value="received">Received</option>
                    <option value="refund_pending">Refund Pending</option>
                    <option value="refunded">Refunded</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {error && <div className="admin-error">{error}</div>}

            <div className="admin-card">
                {loading ? (
                    <div className="admin-loading">
                        <div className="spinner"></div>
                    </div>
                ) : returns.length === 0 ? (
                    <div className="admin-empty">No return requests found.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID / Order No</th>
                                    <th>Customer</th>
                                    <th>Requested Date</th>
                                    <th>Refund Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {returns.map(req => (
                                    <tr key={req._id}>
                                        <td>
                                            <div style={{ fontWeight: '500' }}>{req._id.substring(req._id.length - 8)}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--color-slate-400)' }}>{req.orderNumber}</div>
                                        </td>
                                        <td>
                                            <div>{req.userId?.name || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--color-slate-400)' }}>{req.userId?.email || 'N/A'}</div>
                                        </td>
                                        <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                        <td>₹{req.refundAmount.toFixed(2)}</td>
                                        <td>{getStatusBadge(req.status)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <Link to={`/admin/returns/${req._id}`} className="btn-icon" title="View Details">
                                                    <Eye size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className="pagination">
                        <button 
                            className="btn btn-outline btn-sm" 
                            disabled={pagination.page === 1}
                            onClick={() => handlePageChange(pagination.page - 1)}
                        >
                            Previous
                        </button>
                        <span className="page-info">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button 
                            className="btn btn-outline btn-sm" 
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => handlePageChange(pagination.page + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReturns;
