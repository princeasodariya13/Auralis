import { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';
import { Link } from 'react-router-dom';
import { Users, Search, Filter, Eye, ShoppingCart, RotateCcw, Headphones, AlertTriangle } from 'lucide-react';
import './AdminDashboard.css';

const AdminCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCustomers, setTotalCustomers] = useState(0);

    const [search, setSearch] = useState('');
    const [segment, setSegment] = useState('ALL');
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState(-1);

    const fetchCustomers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminService.getCustomers({
                search,
                segment,
                page,
                limit: 15,
                sortField,
                sortOrder
            });
            setCustomers(res.data);
            setTotalPages(res.pages);
            setTotalCustomers(res.total);
        } catch (err) {
            setError(err.message || 'Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCustomers();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search, segment, page, sortField, sortOrder]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 1 ? -1 : 1);
        } else {
            setSortField(field);
            setSortOrder(-1);
        }
    };

    const getSegmentBadge = (segment) => {
        switch (segment) {
            case 'VIP': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'REPEAT': return 'bg-green-100 text-green-800 border-green-200';
            case 'ONE_TIME': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'NEW': return 'bg-sky-100 text-sky-800 border-sky-200';
            case 'AT_RISK': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'INACTIVE': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="admin-customers-page">
            <div className="page-header">
                <div>
                    <h1 className="d-flex align-items-center gap-2">
                        <Users size={24} className="text-primary" /> Customer Intelligence
                    </h1>
                    <p className="text-muted" style={{fontSize:'0.9rem'}}>Analyze customer lifecycle and behavior.</p>
                </div>
                <div className="text-muted" style={{fontSize:'0.85rem', fontWeight:500}}>
                    Total: <strong>{totalCustomers}</strong> customers
                </div>
            </div>

            <div className="admin-panel mb-6">
                <div className="filters-bar">
                    <div className="search-box">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className="filter-group">
                        <Filter size={18} style={{color:'var(--color-slate-400)'}} />
                        <select
                            value={segment}
                            onChange={(e) => { setSegment(e.target.value); setPage(1); }}
                        >
                            <option value="ALL">All Segments</option>
                            <option value="VIP">VIP</option>
                            <option value="REPEAT">Repeat</option>
                            <option value="ONE_TIME">One Time</option>
                            <option value="NEW">New</option>
                            <option value="AT_RISK">At Risk</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>
            {/* end filters panel */}

            <div className="admin-panel">
                {error && <div className="p-4" style={{color:'var(--color-danger)',background:'#fee2e2'}}>{error}</div>}
                <div className="table-responsive">
                    <table className="admin-table customers-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('name')} style={{cursor:'pointer'}}>Customer {sortField === 'name' && (sortOrder === 1 ? '↑' : '↓')}</th>
                                <th>Segment</th>
                                <th onClick={() => handleSort('paidOrderCount')} style={{cursor:'pointer'}}>Orders {sortField === 'paidOrderCount' && (sortOrder === 1 ? '↑' : '↓')}</th>
                                <th onClick={() => handleSort('lifetimeRevenue')} style={{cursor:'pointer'}}>LTV / AOV {sortField === 'lifetimeRevenue' && (sortOrder === 1 ? '↑' : '↓')}</th>
                                <th onClick={() => handleSort('lastPurchaseDate')} style={{cursor:'pointer'}}>Last Purchase {sortField === 'lastPurchaseDate' && (sortOrder === 1 ? '↑' : '↓')}</th>
                                <th>Indicators</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-muted">Loading customers...</td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-muted">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : (
                                customers.map(cust => (
                                    <tr key={cust._id} className="hover:bg-surface-alt transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800">{cust.name}</div>
                                            <div className="text-xs text-muted">{cust.email}</div>
                                            <div className="text-[10px] text-muted mt-1">Joined: {new Date(cust.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2 py-1 rounded-full border ${getSegmentBadge(cust.segment)}`}>
                                                {cust.segment.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {cust.paidOrderCount}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">${(cust.lifetimeRevenue || 0).toFixed(2)}</div>
                                            <div className="text-xs text-muted mt-0.5">Avg: ${(cust.averageOrderValue || 0).toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {cust.lastPurchaseDate 
                                                ? new Date(cust.lastPurchaseDate).toLocaleDateString()
                                                : <span className="text-muted">-</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {cust.hasAbandonedCart && <ShoppingCart size={16} className="text-orange-500" title="Active abandoned cart" />}
                                                {cust.returnCount > 0 && <RotateCcw size={16} className="text-muted" title={`${cust.returnCount} returns`} />}
                                                {cust.openSupportTickets > 0 && <Headphones size={16} className="text-red-500" title={`${cust.openSupportTickets} open support tickets`} />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link 
                                                to={`/admin/customers/${cust._id}`}
                                                className="btn btn-sm btn-outline-primary inline-flex items-center gap-1"
                                            >
                                                <Eye size={14} /> View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="panel-footer">
                        <span className="pagination-info">Page {page} of {totalPages}</span>
                        <div className="pagination-buttons">
                            <button className="btn-pagination" disabled={page === 1} onClick={() => setPage(page - 1)}>&laquo;</button>
                            <span className="pagination-current">{page} / {totalPages}</span>
                            <button className="btn-pagination" disabled={page === totalPages} onClick={() => setPage(page + 1)}>&raquo;</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCustomers;
