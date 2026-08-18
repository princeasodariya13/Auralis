import React, { useState, useEffect, Suspense } from 'react';
import { adminService } from '../../services/apiService';
import { RefreshCw, Search, ChevronLeft, ChevronRight, Activity, FileText, CheckCircle, XCircle, User, Info, FileCode } from 'lucide-react';
import '../../assets/AdminAuditLogs.css';

const AdminAuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [filtersData, setFiltersData] = useState({ actions: [], resourceTypes: [], admins: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLog, setSelectedLog] = useState(null);

    const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1 });
    const [filters, setFilters] = useState({
        action: 'ALL',
        resourceType: 'ALL',
        adminUserId: 'ALL',
        success: 'ALL'
    });

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const data = await adminService.getAuditFilters();
                setFiltersData(data);
            } catch (err) {
                console.error('Failed to load audit filters', err);
            }
        };
        loadFilters();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const data = await adminService.getAuditLogs({
                page: pagination.page,
                limit: pagination.limit,
                action: filters.action,
                resourceType: filters.resourceType,
                adminUserId: filters.adminUserId,
                success: filters.success
            });
            
            setLogs(data.logs);
            setPagination(prev => ({
                ...prev,
                totalPages: data.pagination.totalPages,
                total: data.pagination.total
            }));
        } catch (err) {
            setError(err.message || 'Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line
    }, [pagination.page, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    return (
        <div className="admin-audit-logs">
            <div className="admin-header">
                <div>
                    <h1>Audit Logs</h1>
                    <p>Track all administrative actions, data changes, and system operations.</p>
                </div>
                <button onClick={fetchLogs} className="btn-secondary" disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spinner' : ''} />
                    Refresh Logs
                </button>
            </div>

            <div className="admin-filters audit-filters">
                <div className="filter-group">
                    <label>Action Type</label>
                    <select name="action" value={filters.action} onChange={handleFilterChange}>
                        <option value="ALL">All Actions</option>
                        {filtersData.actions.map(action => (
                            <option key={action} value={action}>{action}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Resource Type</label>
                    <select name="resourceType" value={filters.resourceType} onChange={handleFilterChange}>
                        <option value="ALL">All Resources</option>
                        {filtersData.resourceTypes.map(rt => (
                            <option key={rt} value={rt}>{rt}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Admin User</label>
                    <select name="adminUserId" value={filters.adminUserId} onChange={handleFilterChange}>
                        <option value="ALL">All Admins</option>
                        {filtersData.admins.map(admin => (
                            <option key={admin._id} value={admin._id}>{admin.name}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Status</label>
                    <select name="success" value={filters.success} onChange={handleFilterChange}>
                        <option value="ALL">Any Status</option>
                        <option value="true">Success Only</option>
                        <option value="false">Failure Only</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="admin-error">
                    <XCircle size={24} />
                    <p>{error}</p>
                </div>
            )}

            <div className="admin-table-container audit-table">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Admin</th>
                            <th>Action</th>
                            <th>Resource</th>
                            <th>Status</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && logs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="table-loading">
                                    <RefreshCw className="spinner" size={32} />
                                    <p>Loading audit logs...</p>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="table-empty">
                                    <FileText size={48} />
                                    <p>No audit logs found matching your filters.</p>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log._id}>
                                    <td>
                                        <div className="audit-time">
                                            <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                                            <span className="text-muted text-sm">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="audit-admin">
                                            <User size={14} className="text-muted" />
                                            <span>{log.adminUserId?.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td><span className="audit-action">{log.action}</span></td>
                                    <td>
                                        <div className="audit-resource">
                                            <span className="resource-type">{log.resourceType}</span>
                                            <span className="resource-id text-muted" title={log.resourceId}>
                                                {log.resourceId.substring(0, 8)}...
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        {log.success ? (
                                            <span className="badge badge-success"><CheckCircle size={12} /> Success</span>
                                        ) : (
                                            <span className="badge badge-error"><XCircle size={12} /> Failed</span>
                                        )}
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-icon" 
                                            onClick={() => setSelectedLog(log)}
                                            title="View Payload Details"
                                        >
                                            <FileCode size={18} />
                                        </button>
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
                        <ChevronLeft size={18} /> Prev
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

            {selectedLog && (
                <div className="audit-modal-overlay" onClick={() => setSelectedLog(null)}>
                    <div className="audit-modal" onClick={e => e.stopPropagation()}>
                        <div className="audit-modal-header">
                            <h2>Audit Log Details</h2>
                            <button className="close-btn" onClick={() => setSelectedLog(null)}><XCircle size={24} /></button>
                        </div>
                        <div className="audit-modal-body">
                            <div className="audit-info-grid">
                                <div className="info-block">
                                    <label>Action</label>
                                    <div className="audit-action-large">{selectedLog.action}</div>
                                </div>
                                <div className="info-block">
                                    <label>Status</label>
                                    <div>
                                        {selectedLog.success ? (
                                            <span className="badge badge-success">Success</span>
                                        ) : (
                                            <span className="badge badge-error">Failed: {selectedLog.failureReason}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="info-block">
                                    <label>Administrator</label>
                                    <div>{selectedLog.adminUserId?.name} ({selectedLog.adminUserId?.email})</div>
                                </div>
                                <div className="info-block">
                                    <label>Timestamp</label>
                                    <div>{new Date(selectedLog.createdAt).toLocaleString()}</div>
                                </div>
                                <div className="info-block">
                                    <label>Resource Type</label>
                                    <div>{selectedLog.resourceType}</div>
                                </div>
                                <div className="info-block">
                                    <label>Resource ID</label>
                                    <div className="font-mono text-sm">{selectedLog.resourceId}</div>
                                </div>
                            </div>

                            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                <div className="audit-json-section">
                                    <h3><Info size={16} /> Metadata</h3>
                                    <pre className="json-block">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                                </div>
                            )}

                            {selectedLog.previousState && Object.keys(selectedLog.previousState).length > 0 && (
                                <div className="audit-json-section">
                                    <h3>Previous State</h3>
                                    <pre className="json-block diff-old">{JSON.stringify(selectedLog.previousState, null, 2)}</pre>
                                </div>
                            )}

                            {selectedLog.newState && Object.keys(selectedLog.newState).length > 0 && (
                                <div className="audit-json-section">
                                    <h3>New State</h3>
                                    <pre className="json-block diff-new">{JSON.stringify(selectedLog.newState, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAuditLogs;
