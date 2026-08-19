import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supportService } from '../services/apiService';
import { Search, Plus, MessageSquare, Clock, ArrowRight, X, ArrowLeft } from 'lucide-react';
import { EmptyState, ErrorState } from '../components/States';

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
    const [formError, setFormError] = useState('');

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
        setFormError('');
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
            setFormError(err.message || 'We couldnt submit your ticket. Please try again.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'OPEN': return 'badge-info';
            case 'IN_PROGRESS': return 'badge-warning';
            case 'WAITING_CUSTOMER': return 'badge-primary';
            case 'RESOLVED': return 'badge-success';
            case 'CLOSED': return 'badge-neutral';
            default: return 'badge-neutral';
        }
    };

    return (
        <div className="section container" style={{ minHeight: '70vh' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'var(--spacing-lg) 0' }}>
                <button onClick={() => navigate('/account')} className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', border: 'none', padding: 0 }}>
                    <ArrowLeft size={16} /> Back to Account
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>Support Tickets</h1>
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="btn btn-primary"
                    >
                        {showForm ? <X size={18} /> : <Plus size={18} />}
                        {showForm ? 'Cancel' : 'New Ticket'}
                    </button>
                </div>

                {showForm && (
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>Create New Ticket</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Category *</label>
                                    <select 
                                        value={category} 
                                        onChange={(e) => setCategory(e.target.value)}
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
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Order Number (Optional)</label>
                                    <input 
                                        type="text" 
                                        className="form-control"
                                        value={orderNumber} 
                                        onChange={(e) => setOrderNumber(e.target.value)}
                                        placeholder="e.g. ORD-123456"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Subject *</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    value={subject} 
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Message *</label>
                                <textarea 
                                    className="form-control"
                                    value={message} 
                                    onChange={(e) => setMessage(e.target.value)}
                                    style={{ minHeight: '150px', resize: 'vertical' }}
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={submitLoading}
                                className="btn btn-primary"
                                style={{ marginTop: '1rem' }}
                            >
                                {submitLoading ? 'Submitting...' : 'Submit Ticket'}
                            </button>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        Loading tickets...
                    </div>
                ) : error ? (
                    <ErrorState message={error} onRetry={fetchTickets} />
                ) : tickets.length === 0 ? (
                    <EmptyState 
                        icon={MessageSquare}
                        title="No support tickets found"
                        message="If you have any questions or need assistance, feel free to open a new ticket."
                    />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {tickets.map(ticket => (
                            <div key={ticket.ticketNumber} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: '600' }}>{ticket.subject}</h3>
                                            <span className={`badge ${getStatusClass(ticket.status)}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span>#{ticket.ticketNumber}</span>
                                            <span>•</span>
                                            <span>{ticket.category}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => navigate(`/account/support/${ticket.ticketNumber}`)}
                                        className="btn btn-outline btn-sm"
                                    >
                                        View Details
                                    </button>
                                </div>
                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-slate-500)' }}>
                                    <span>Last Updated: {new Date(ticket.lastActivityAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportTickets;
