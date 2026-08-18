import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supportService } from '../services/apiService';
import { Search, Plus, MessageSquare, Clock, ArrowRight, X } from 'lucide-react';
import './Orders.css'; // Reuse existing styles if applicable

const SupportTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    
    // Form state
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('ORDER');
    const [message, setMessage] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    const navigate = useNavigate();

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await supportService.getTickets();
            setTickets(res.tickets);
        } catch (err) {
            setError(err.message || 'Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitLoading(true);
            await supportService.createTicket({ subject, category, message, orderNumber: orderNumber || undefined });
            setShowForm(false);
            setSubject('');
            setMessage('');
            setOrderNumber('');
            setCategory('ORDER');
            fetchTickets();
        } catch (err) {
            alert(err.message || 'Failed to create ticket');
        } finally {
            setSubmitLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'OPEN': return 'text-blue-600 bg-blue-50';
            case 'IN_PROGRESS': return 'text-amber-600 bg-amber-50';
            case 'WAITING_CUSTOMER': return 'text-purple-600 bg-purple-50';
            case 'RESOLVED': return 'text-green-600 bg-green-50';
            case 'CLOSED': return 'text-slate-600 bg-slate-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    return (
        <div className="orders-container max-w-5xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-montserrat font-light text-slate-900 tracking-tight">Support Tickets</h1>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white hover:bg-slate-800 transition-colors rounded-none font-medium"
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    {showForm ? 'Cancel' : 'New Ticket'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white border border-slate-200 p-8 mb-8 shadow-sm">
                    <h2 className="text-xl font-medium mb-6 font-montserrat">Create New Ticket</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                                <select 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full p-3 border border-slate-300 focus:outline-none focus:border-slate-900 bg-white"
                                    required
                                >
                                    <option value="ORDER">Order Issue</option>
                                    <option value="PAYMENT">Payment/Billing</option>
                                    <option value="REFUND">Refund Inquiry</option>
                                    <option value="RETURN">Return Request</option>
                                    <option value="PRODUCT">Product Support</option>
                                    <option value="ACCOUNT">Account Issue</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Order Number (Optional)</label>
                                <input 
                                    type="text" 
                                    value={orderNumber} 
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    className="w-full p-3 border border-slate-300 focus:outline-none focus:border-slate-900"
                                    placeholder="e.g. ORD-123456"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Subject *</label>
                            <input 
                                type="text" 
                                value={subject} 
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full p-3 border border-slate-300 focus:outline-none focus:border-slate-900"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Message *</label>
                            <textarea 
                                value={message} 
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full p-3 border border-slate-300 focus:outline-none focus:border-slate-900 min-h-[150px]"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={submitLoading}
                            className="px-8 py-3 bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors w-full md:w-auto"
                        >
                            {submitLoading ? 'Submitting...' : 'Submit Ticket'}
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                </div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-none border border-red-200">
                    {error}
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 border border-slate-200">
                    <MessageSquare size={48} className="mx-auto text-slate-400 mb-4" />
                    <h2 className="text-xl font-medium text-slate-900 mb-2 font-montserrat">No support tickets found</h2>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">
                        If you have any questions or need assistance, feel free to open a new ticket.
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-4 font-medium text-slate-900 uppercase text-xs tracking-wider">Ticket</th>
                                    <th className="p-4 font-medium text-slate-900 uppercase text-xs tracking-wider">Subject</th>
                                    <th className="p-4 font-medium text-slate-900 uppercase text-xs tracking-wider">Status</th>
                                    <th className="p-4 font-medium text-slate-900 uppercase text-xs tracking-wider hidden sm:table-cell">Last Updated</th>
                                    <th className="p-4 font-medium text-slate-900 uppercase text-xs tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(ticket => (
                                    <tr key={ticket.ticketNumber} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <span className="font-medium text-slate-900">{ticket.ticketNumber}</span>
                                            <span className="block text-xs text-slate-500 mt-1">{ticket.category}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-slate-700 font-medium">{ticket.subject}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 hidden sm:table-cell text-slate-500 text-sm">
                                            {new Date(ticket.lastActivityAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => navigate(`/account/support/${ticket.ticketNumber}`)}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
                                            >
                                                View <ArrowRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportTickets;
