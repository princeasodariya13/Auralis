import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminSupportService } from '../../services/apiService';
import { Search, Filter, MessageSquare, ArrowRight, Clock } from 'lucide-react';
import './AdminOrders.css'; // Reuse existing styles

const AdminSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const navigate = useNavigate();

    const fetchTickets = async (page = 1) => {
        try {
            setLoading(true);
            const res = await adminSupportService.getTickets({
                page,
                limit: 15,
                search,
                status: statusFilter,
                priority: priorityFilter
            });
            setTickets(res.tickets);
            setPagination(res.pagination);
        } catch (err) {
            setError(err.message || 'Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchTickets(1);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search, statusFilter, priorityFilter]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'IN_PROGRESS': return 'bg-amber-100 text-amber-800 border border-amber-200';
            case 'WAITING_CUSTOMER': return 'bg-purple-100 text-purple-800 border border-purple-200';
            case 'RESOLVED': return 'bg-green-100 text-green-800 border border-green-200';
            case 'CLOSED': return 'bg-slate-100 text-slate-800 border border-slate-200';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'URGENT': return <span className="w-2 h-2 rounded-full bg-red-600 inline-block mr-2"></span>;
            case 'HIGH': return <span className="w-2 h-2 rounded-full bg-orange-500 inline-block mr-2"></span>;
            case 'NORMAL': return <span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-2"></span>;
            case 'LOW': return <span className="w-2 h-2 rounded-full bg-slate-400 inline-block mr-2"></span>;
            default: return null;
        }
    };

    return (
        <div className="admin-page p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold font-montserrat text-slate-900">Service Desk</h1>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search tickets by subject, ID, or order..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-slate-300 rounded px-4 py-2 focus:outline-none focus:border-indigo-500 bg-white"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="WAITING_CUSTOMER">Waiting on Customer</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="border border-slate-300 rounded px-4 py-2 focus:outline-none focus:border-indigo-500 bg-white"
                        >
                            <option value="ALL">All Priorities</option>
                            <option value="URGENT">Urgent</option>
                            <option value="HIGH">High</option>
                            <option value="NORMAL">Normal</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
                    {error}
                </div>
            )}

            <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket / Customer</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Activity</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </td>
                                </tr>
                            ) : tickets.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        <MessageSquare className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        <p>No tickets found matching your criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                tickets.map(ticket => (
                                    <tr key={ticket._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900">{ticket.ticketNumber}</div>
                                            <div className="text-sm text-slate-500">{ticket.userId?.email || 'Unknown User'}</div>
                                            <div className="text-xs text-slate-400 mt-1">{ticket.category}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-900 font-medium max-w-xs truncate">{ticket.subject}</div>
                                            {ticket.orderNumber && (
                                                <div className="text-xs text-indigo-600 mt-1 cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${ticket.orderNumber}`); }}>
                                                    Order: {ticket.orderNumber}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center text-sm font-medium">
                                                {getPriorityIcon(ticket.priority)}
                                                {ticket.priority}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {new Date(ticket.lastActivityAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs mt-1">
                                                {new Date(ticket.lastActivityAt).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => navigate(`/admin/support/${ticket.ticketNumber}`)}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1 rounded"
                                            >
                                                Manage <ArrowRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-700">
                                    Showing <span className="font-medium">{((pagination.page - 1) * 15) + 1}</span> to <span className="font-medium">{Math.min(pagination.page * 15, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> tickets
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    {Array.from({ length: pagination.pages }, (_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => fetchTickets(i + 1)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                pagination.page === i + 1
                                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                    : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupport;
