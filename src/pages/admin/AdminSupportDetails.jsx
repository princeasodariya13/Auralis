import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminSupportService } from '../../services/apiService';
import { ArrowLeft, Send, Shield, User as UserIcon, Lock, Search, FileText } from 'lucide-react';

const AdminSupportDetails = () => {
    const { ticketNumber } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [replying, setReplying] = useState(false);

    const messagesEndRef = useRef(null);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            const res = await adminSupportService.getTicketDetails(ticketNumber);
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
            const newMessage = await adminSupportService.addMessage(ticketNumber, { message: replyText, isInternal });
            setMessages([...messages, newMessage]);
            setReplyText('');
            // If it's a public reply, optimistcally update state to WAITING_CUSTOMER if it was OPEN/IN_PROGRESS
            if (!isInternal && (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS')) {
                setTicket({ ...ticket, status: 'WAITING_CUSTOMER', lastActivityAt: new Date() });
            }
        } catch (err) {
            alert(err.message || 'Failed to send reply');
        } finally {
            setReplying(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await adminSupportService.updateTicketStatus(ticketNumber, newStatus);
            setTicket({ ...ticket, status: newStatus });
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handlePriorityChange = async (newPriority) => {
        try {
            await adminSupportService.updateTicketPriority(ticketNumber, newPriority);
            setTicket({ ...ticket, priority: newPriority });
        } catch (err) {
            alert('Failed to update priority');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="p-6">
                <div className="p-6 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                    <h2 className="text-xl font-medium mb-2">Error</h2>
                    <p>{error || 'Ticket not found.'}</p>
                    <button onClick={() => navigate('/admin/support')} className="mt-4 px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded">
                        Back to Service Desk
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-80px)]">
            <button 
                onClick={() => navigate('/admin/support')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4 transition-colors font-medium w-fit"
            >
                <ArrowLeft size={18} /> Back to Tickets
            </button>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                
                {/* LEFT COLUMN: Conversation */}
                <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-xl font-montserrat font-semibold text-slate-900">{ticket.subject}</h1>
                                <p className="text-sm text-slate-500 mt-1">Ticket {ticket.ticketNumber}</p>
                            </div>
                            <div className="text-right">
                                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold mb-1">
                                    {ticket.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                        {messages.map((msg, index) => {
                            const isCustomer = msg.senderType === 'CUSTOMER';
                            const isSystem = msg.senderType === 'SYSTEM';
                            const isInternalNote = msg.isInternal;

                            return (
                                <div key={msg._id || index} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[85%] flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}>
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            {isCustomer && <UserIcon size={14} className="text-slate-500" />}
                                            {!isCustomer && !isSystem && <Shield size={14} className="text-indigo-600" />}
                                            <span className="text-xs font-medium text-slate-500">
                                                {isCustomer ? ticket.userId?.name : (isSystem ? 'System' : msg.senderId?.name || 'Admin')}
                                            </span>
                                            {isInternalNote && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
                                                    <Lock size={10} /> Internal Note
                                                </span>
                                            )}
                                        </div>
                                        <div className={`p-4 text-sm leading-relaxed shadow-sm
                                            ${isCustomer ? 'bg-white border border-slate-200 text-slate-800 rounded-tr-xl rounded-br-xl rounded-bl-xl' 
                                            : isInternalNote ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-xl rounded-bl-xl rounded-br-xl' 
                                            : 'bg-indigo-600 text-white rounded-tl-xl rounded-bl-xl rounded-br-xl'}`}
                                        >
                                            {msg.message.split('\n').map((line, i) => (
                                                <React.Fragment key={i}>
                                                    {line}
                                                    {i !== msg.message.split('\n').length - 1 && <br />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                                            {new Date(msg.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Reply Area */}
                    <div className="p-4 border-t border-slate-200 bg-white rounded-b-lg">
                        <form onSubmit={handleReply} className="flex flex-col gap-3">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type a reply or internal note..."
                                className="w-full p-3 border border-slate-300 rounded focus:outline-none focus:border-indigo-500 resize-none"
                                rows="3"
                                required
                            />
                            <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={isInternal} 
                                        onChange={(e) => setIsInternal(e.target.checked)}
                                        className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                    />
                                    <span className="flex items-center gap-1 font-medium"><Lock size={14}/> Internal Note (Hidden from Customer)</span>
                                </label>
                                <button
                                    type="submit"
                                    disabled={replying || !replyText.trim()}
                                    className={`px-6 py-2 flex justify-center items-center gap-2 text-white font-medium rounded transition-colors disabled:opacity-50
                                        ${isInternal ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                >
                                    <Send size={16} />
                                    <span>{isInternal ? 'Add Note' : 'Send Reply'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* RIGHT COLUMN: Metadata & Controls */}
                <div className="w-full lg:w-80 flex flex-col gap-6 overflow-y-auto">
                    {/* Customer Info */}
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Customer</h3>
                        <div className="flex flex-col gap-2 text-sm">
                            <div className="flex items-center gap-2 font-medium text-slate-900">
                                <UserIcon size={16} className="text-slate-400"/> {ticket.userId?.name}
                            </div>
                            <div className="text-slate-600 pl-6">
                                {ticket.userId?.email}
                            </div>
                        </div>
                    </div>

                    {/* Ticket Controls */}
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Ticket Settings</h3>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                            <select 
                                value={ticket.status} 
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-indigo-500 bg-white"
                            >
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="WAITING_CUSTOMER">Waiting on Customer</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
                            <select 
                                value={ticket.priority} 
                                onChange={(e) => handlePriorityChange(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-indigo-500 bg-white"
                            >
                                <option value="URGENT">Urgent</option>
                                <option value="HIGH">High</option>
                                <option value="NORMAL">Normal</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                            <div className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 cursor-not-allowed">
                                {ticket.category}
                            </div>
                        </div>

                        {ticket.orderNumber && (
                            <div className="pt-2 border-t border-slate-100 mt-2">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Linked Order</label>
                                <button 
                                    onClick={() => navigate(`/admin/orders/${ticket.orderNumber}`)}
                                    className="flex items-center justify-between w-full p-2 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded text-sm hover:bg-indigo-100 transition-colors"
                                >
                                    <span className="flex items-center gap-2"><FileText size={14}/> {ticket.orderNumber}</span>
                                    <Search size={14} />
                                </button>
                            </div>
                        )}
                        
                        {ticket.returnRequestId && (
                            <div className="pt-2 border-t border-slate-100 mt-2">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Linked Return</label>
                                <button 
                                    onClick={() => navigate(`/admin/returns/${ticket.returnRequestId}`)}
                                    className="flex items-center justify-between w-full p-2 border border-orange-200 bg-orange-50 text-orange-700 rounded text-sm hover:bg-orange-100 transition-colors"
                                >
                                    <span className="flex items-center gap-2"><FileText size={14}/> View Return</span>
                                    <Search size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminSupportDetails;
