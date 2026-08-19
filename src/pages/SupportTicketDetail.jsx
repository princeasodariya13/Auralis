import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supportService } from '../services/apiService';
import { ArrowLeft, Clock, Send, Shield, User } from 'lucide-react';

const SupportTicketDetail = () => {
    const { ticketNumber } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replying, setReplying] = useState(false);
    const [replyError, setReplyError] = useState(null);
    
    const messagesEndRef = useRef(null);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            const res = await supportService.getTicketDetails(ticketNumber);
            setTicket(res.ticket);
            setMessages(res.messages);
        } catch (err) {
            setError(err.message || 'Failed to load ticket details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicket();
    }, [ticketNumber]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        
        setReplyError(null);

        try {
            setReplying(true);
            const newMessage = await supportService.replyToTicket(ticketNumber, replyText);
            setMessages([...messages, newMessage]);
            setReplyText('');
            // Optimistically update ticket status to IN_PROGRESS
            if (['WAITING_CUSTOMER', 'RESOLVED'].includes(ticket.status)) {
                setTicket({ ...ticket, status: 'IN_PROGRESS', lastActivityAt: new Date() });
            }
        } catch (err) {
            setReplyError(err.message || 'We couldnt send your reply. Please try again.');
        } finally {
            setReplying(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <p>Loading ticket details...</p>
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="section container">
                <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Error</h2>
                    <p>{error || 'Ticket not found.'}</p>
                    <button onClick={() => navigate('/account/support')} className="btn btn-outline" style={{ marginTop: '1rem' }}>
                        Back to Support
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="section container" style={{ minHeight: '70vh' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--spacing-lg) 0' }}>
                <button 
                    onClick={() => navigate('/account/support')}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', border: 'none', padding: 0 }}
                >
                    <ArrowLeft size={16} /> Back to Tickets
                </button>

                <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: '600px' }}>
                    {/* Header */}
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-slate-50)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{ticket.subject}</h1>
                                        <span className="badge badge-neutral">{ticket.ticketNumber}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--color-slate-600)' }}>
                                        <span><strong>Category:</strong> {ticket.category}</span>
                                        {ticket.orderNumber && (
                                            <span><strong>Order:</strong> <button onClick={() => navigate(`/orders/${ticket.orderNumber}`)} style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{ticket.orderNumber}</button></span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className="badge badge-primary" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                                        <Clock size={14} /> Updated {new Date(ticket.lastActivityAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Conversation area */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {messages.map((msg, index) => {
                            const isCustomer = msg.senderType === 'CUSTOMER';
                            return (
                                <div key={msg._id || index} style={{ display: 'flex', justifyContent: isCustomer ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', alignItems: isCustomer ? 'flex-end' : 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-slate-500)' }}>
                                                {isCustomer ? 'You' : 'Auralis Support'}
                                            </span>
                                            {msg.senderType === 'ADMIN' && <Shield size={12} color="var(--color-primary)" />}
                                        </div>
                                        <div style={{ 
                                            padding: '1rem', 
                                            fontSize: '0.95rem', 
                                            lineHeight: 1.6, 
                                            backgroundColor: isCustomer ? 'var(--color-slate-900)' : 'var(--color-slate-100)', 
                                            color: isCustomer ? 'var(--color-white)' : 'var(--color-slate-900)',
                                            borderRadius: isCustomer ? '12px 12px 0 12px' : '12px 12px 12px 0' 
                                        }}>
                                            {msg.message.split('\n').map((line, i) => (
                                                <React.Fragment key={i}>
                                                    {line}
                                                    {i !== msg.message.split('\n').length - 1 && <br />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        <span style={{ fontSize: '10px', color: 'var(--color-slate-400)', marginTop: '0.25rem' }}>
                                            {new Date(msg.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Reply box */}
                    <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-slate-50)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
                        {ticket.status === 'CLOSED' ? (
                            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-slate-500)' }}>
                                This ticket has been closed and cannot be replied to.
                            </div>
                        ) : (
                            <form onSubmit={handleReply} style={{ display: 'flex', gap: '1rem' }}>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your reply here..."
                                    style={{ flex: 1, padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', resize: 'none', fontFamily: 'inherit' }}
                                    rows="3"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={replying || !replyText.trim()}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', padding: '0 1.5rem' }}
                                >
                                    <Send size={20} />
                                    <span style={{ fontSize: '0.75rem' }}>Send</span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportTicketDetail;
