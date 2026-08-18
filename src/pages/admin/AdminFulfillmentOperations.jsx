import { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';
import { Truck, AlertTriangle, CheckCircle, Clock, PackageX, ChevronDown, Filter, RefreshCw, Eye, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminFulfillmentOperations = () => {
    const [exceptions, setExceptions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState('OPEN');
    const [severityFilter, setSeverityFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');

    const [resolvingId, setResolvingId] = useState(null);
    const [resolutionNote, setResolutionNote] = useState('');

    const fetchSummary = async () => {
        try {
            const data = await adminService.getExceptionsSummary();
            setSummary(data);
        } catch (err) {
            console.error('Failed to fetch summary:', err);
        }
    };

    const fetchExceptions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await adminService.getShipmentExceptions({
                status: statusFilter,
                severity: severityFilter,
                type: typeFilter,
                page,
                limit: 10
            });
            setExceptions(response.data);
            setTotalPages(response.pages);
        } catch (err) {
            setError(err.message || 'Failed to fetch shipment exceptions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    useEffect(() => {
        fetchExceptions();
    }, [page, statusFilter, severityFilter, typeFilter]);

    const handleAcknowledge = async (id) => {
        try {
            await adminService.acknowledgeException(id);
            await fetchExceptions();
            await fetchSummary();
        } catch (err) {
            alert(err.message || 'Failed to acknowledge');
        }
    };

    const handleResolve = async (id) => {
        try {
            await adminService.resolveException(id, resolutionNote);
            setResolvingId(null);
            setResolutionNote('');
            await fetchExceptions();
            await fetchSummary();
        } catch (err) {
            alert(err.message || 'Failed to resolve');
        }
    };

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-100 text-red-800 border border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-800 border border-orange-200';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'LOW': return 'bg-blue-100 text-blue-800 border border-blue-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="admin-page p-6 max-w-7xl mx-auto">
            <div className="d-flex justify-content-between align-items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-1">
                        <Truck size={28} className="text-primary" /> Fulfillment Operations
                    </h1>
                    <p className="text-slate-500 text-sm">Monitor SLA risks, delivery failures, and shipment exceptions.</p>
                </div>
                <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={() => { fetchExceptions(); fetchSummary(); }}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* KPI Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Active Exceptions</p>
                                <h3 className="text-3xl font-bold text-slate-800 mt-1">{summary.totalActive}</h3>
                            </div>
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                <AlertTriangle size={24} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Delivery Failed</p>
                                <h3 className="text-3xl font-bold text-slate-800 mt-1">{summary.byType.DELIVERY_FAILED || 0}</h3>
                            </div>
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <PackageX size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Overdue / SLA Risk</p>
                                <h3 className="text-3xl font-bold text-slate-800 mt-1">
                                    {(summary.byType.OVERDUE_DELIVERY || 0) + (summary.byType.STUCK_IN_TRANSIT || 0)}
                                </h3>
                            </div>
                            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                                <Clock size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Returned to Sender</p>
                                <h3 className="text-3xl font-bold text-slate-800 mt-1">{summary.byType.RETURNED_TO_SENDER || 0}</h3>
                            </div>
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <AlertTriangle size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-600 font-medium mr-2">
                    <Filter size={18} /> Filters:
                </div>
                
                <select 
                    className="form-select w-auto form-select-sm" 
                    value={statusFilter} 
                    onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                >
                    <option value="ALL">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="ACKNOWLEDGED">Acknowledged</option>
                    <option value="RESOLVED">Resolved</option>
                </select>

                <select 
                    className="form-select w-auto form-select-sm" 
                    value={severityFilter} 
                    onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}
                >
                    <option value="ALL">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>

                <select 
                    className="form-select w-auto form-select-sm" 
                    value={typeFilter} 
                    onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                >
                    <option value="ALL">All Exception Types</option>
                    <option value="OVERDUE_DELIVERY">Overdue Delivery</option>
                    <option value="DELIVERY_FAILED">Delivery Failed</option>
                    <option value="RETURNED_TO_SENDER">Returned to Sender</option>
                    <option value="STUCK_CREATED">Stuck: Created</option>
                    <option value="STUCK_PACKED">Stuck: Packed</option>
                    <option value="STUCK_IN_TRANSIT">Stuck: In Transit</option>
                    <option value="PARTIAL_ORDER_DELAY">Partial Order Delay</option>
                </select>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {error && <div className="p-4 bg-red-50 text-red-600 border-b border-red-100">{error}</div>}
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Type & Severity</th>
                                <th className="px-6 py-4">Order / Shipment</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Detected</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">Loading exceptions...</td>
                                </tr>
                            ) : exceptions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <CheckCircle size={32} className="text-green-500 mb-2" />
                                            <p className="font-medium text-lg text-slate-700">All clear!</p>
                                            <p>No shipment exceptions found for the current filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                exceptions.map(exc => (
                                    <tr key={exc._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800 mb-1">{exc.type.replace(/_/g, ' ')}</div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeverityBadge(exc.severity)}`}>
                                                {exc.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="mb-1">
                                                <Link to={`/admin/orders/${exc.orderNumber}`} className="text-primary hover:underline font-medium d-flex align-items-center gap-1">
                                                    #{exc.orderNumber}
                                                </Link>
                                            </div>
                                            {exc.shipmentId ? (
                                                <div className="text-xs text-slate-500 font-mono flex flex-col gap-1">
                                                    <span>{exc.shipmentId.carrier}</span>
                                                    <span>{exc.shipmentId.trackingNumber || 'No tracking'}</span>
                                                    <span className="uppercase text-[10px] bg-slate-100 px-1 py-0.5 rounded w-fit">{exc.shipmentId.status}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">No specific shipment</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {exc.userId ? (
                                                <>
                                                    <div className="font-medium text-slate-800">{exc.userId.name}</div>
                                                    <div className="text-xs text-slate-500">{exc.userId.email}</div>
                                                </>
                                            ) : 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                            {new Date(exc.detectedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                exc.status === 'OPEN' ? 'bg-red-100 text-red-700' :
                                                exc.status === 'ACKNOWLEDGED' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                                {exc.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {exc.status === 'OPEN' && (
                                                    <button 
                                                        onClick={() => handleAcknowledge(exc._id)}
                                                        className="px-3 py-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded text-xs font-medium border border-yellow-200 transition-colors"
                                                    >
                                                        Acknowledge
                                                    </button>
                                                )}
                                                {exc.status !== 'RESOLVED' && (
                                                    <button 
                                                        onClick={() => setResolvingId(exc._id)}
                                                        className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-medium border border-green-200 transition-colors"
                                                    >
                                                        Resolve
                                                    </button>
                                                )}
                                                <Link 
                                                    to={`/admin/orders/${exc.orderNumber}`}
                                                    className="p-1 text-slate-400 hover:text-primary transition-colors"
                                                    title="View Order"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                        <span className="text-sm text-slate-600">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                className="btn btn-sm btn-outline-secondary" 
                                disabled={page === 1} 
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </button>
                            <button 
                                className="btn btn-sm btn-outline-secondary" 
                                disabled={page === totalPages} 
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Resolve Modal */}
            {resolvingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Resolve Exception</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Marking this exception as resolved means the operational issue has been handled. 
                            This does NOT automatically update the shipment's carrier status.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Resolution Note (Optional)</label>
                            <textarea 
                                className="form-control w-full p-2 border rounded" 
                                rows="3"
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                placeholder="e.g. Contacted carrier, replacement dispatched..."
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button 
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium transition-colors"
                                onClick={() => { setResolvingId(null); setResolutionNote(''); }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
                                onClick={() => handleResolve(resolvingId)}
                            >
                                Confirm Resolution
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFulfillmentOperations;
