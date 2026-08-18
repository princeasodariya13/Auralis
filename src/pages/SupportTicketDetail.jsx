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
            alert(err.message || 'Failed to send reply');
        } finally {
            setReplying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="p-6 bg-red-50 text-red-700 border border-red-200">
                    <h2 className="text-xl font-medium mb-2">Error</h2>
                    <p>{error || 'Ticket not found.'}</p>
                    <button onClick={() => navigate('/account/support')} className="mt-4 px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 transition-colors">
                        Back to Support
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <button 
                onClick={() => navigate('/account/support')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium"
            >
                <ArrowLeft size={20} /> Back to Tickets
            </button>

            <div className="bg-white border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-200px)] min-h-[600px]">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-montserrat font-light text-slate-900">{ticket.subject}</h1>
                                <span className="text-sm font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{ticket.ticketNumber}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span><strong>Category:</strong> {ticket.category}</span>
                                {ticket.orderNumber && (
                                    <span><strong>Order:</strong> <button onClick={() => navigate(`/orders/${ticket.orderNumber}`)} className="text-indigo-600 hover:underline">{ticket.orderNumber}</button></span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block px-3 py-1 bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider mb-2 text-center">
                                {ticket.status.replace('_', ' ')}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock size={14} /> Updated {new Date(ticket.lastActivityAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Conversation area */}
                <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
                    {messages.map((msg, index) => {
                        const isCustomer = msg.senderType === 'CUSTOMER';
                        return (
                            <div key={msg._id || index} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-slate-500">
                                            {isCustomer ? 'You' : 'Auralis Support'}
                                        </span>
                                        {msg.senderType === 'ADMIN' && <Shield size={12} className="text-indigo-600" />}
                                    </div>
                                    <div className={`p-4 text-sm leading-relaxed ${isCustomer ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`} style={{ borderRadius: isCustomer ? '12px 12px 0 12px' : '12px 12px 12px 0' }}>
                                        {msg.message.split('\n').map((line, i) => (
                                            <React.Fragment key={i}>
                                                {line}
                                                {i !== msg.message.split('\n').length - 1 && <br />}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1">
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Reply box */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    {ticket.status === 'CLOSED' ? (
                        <div className="text-center p-4 text-slate-500">
                            This ticket has been closed and cannot be replied to.
                        </div>
                    ) : (
                        <form onSubmit={handleReply} className="flex gap-4">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your reply here..."
                                className="flex-1 p-3 border border-slate-300 focus:outline-none focus:border-slate-900 bg-white resize-none"
                                rows="3"
                                required
                            />
                            <button
                                type="submit"
                                disabled={replying || !replyText.trim()}
                                className="px-6 bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors flex flex-col justify-center items-center gap-1"
                            >
                                <Send size={20} />
                                <span className="text-xs">Send</span>
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupportTicketDetail;
