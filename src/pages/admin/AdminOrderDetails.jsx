import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../../services/apiService';
import { ArrowLeft, User, MapPin, Package, CreditCard, Clock, FileText, Send } from 'lucide-react';
import AdminShipmentPanel from '../../components/AdminShipmentPanel';
import './AdminOrders.css';

const VALID_TRANSITIONS = {
    'pending_payment': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['delivered'],
    'delivered': [],
    'cancelled': []
};

const AdminOrderDetails = () => {
    const { orderNumber } = useParams();
    const [order, setOrder] = useState(null);
    const [history, setHistory] = useState([]);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [statusError, setStatusError] = useState(null);

    const fetchData = async () => {
        try {
            const [orderData, historyData, notesData] = await Promise.all([
                adminService.getOrderDetails(orderNumber),
                adminService.getOrderHistory(orderNumber, 1, 50),
                adminService.getOrderNotes(orderNumber)
            ]);
            
            setOrder(orderData);
            setHistory(historyData.history);
            setNotes(notesData);
        } catch (err) {
            setError(err.message || 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderNumber]);

    const handleStatusUpdate = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to change order status to ${newStatus}?`)) return;
        
        setStatusUpdating(true);
        setStatusError(null);
        try {
            await adminService.updateOrderStatus(orderNumber, newStatus);
            await fetchData(); // Refresh all data
        } catch (err) {
            setStatusError(err.message || 'Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        try {
            await adminService.addOrderNote(orderNumber, newNote);
            setNewNote('');
            // Refresh notes
            const notesData = await adminService.getOrderNotes(orderNumber);
            setNotes(notesData);
        } catch (err) {
            alert(err.message || 'Failed to add note');
        }
    };

    if (loading) {
        return (
            <div className="admin-order-details-page">
                <div className="skeleton-row mb-4" style={{ height: '40px', width: '200px' }}></div>
                <div className="admin-panel p-4 mb-4"><div className="skeleton-row" style={{ height: '100px' }}></div></div>
                <div className="admin-panel p-4"><div className="skeleton-row" style={{ height: '300px' }}></div></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-empty-state">
                <p className="text-danger">{error}</p>
                <Link to="/admin/orders" className="btn btn-outline mt-4">Back to Orders</Link>
            </div>
        );
    }

    if (!order) return null;

    const allowedTransitions = VALID_TRANSITIONS[order.orderStatus] || [];

    return (
        <div className="admin-order-details-page">
            <header className="page-header mb-4">
                <div>
                    <Link to="/admin/orders" className="back-link">
                        <ArrowLeft size={16} /> Back to Orders
                    </Link>
                    <div className="d-flex align-items-center gap-3 mt-2">
                        <h1>Order {order.orderNumber}</h1>
                        <span className={`status-badge status-${order.orderStatus.toLowerCase()}`}>
                            {order.orderStatus.replace('_', ' ')}
                        </span>
                    </div>
                    <div className="text-muted mt-1">
                        Placed on {new Date(order.createdAt).toLocaleString()}
                    </div>
                </div>
                
                {allowedTransitions.length > 0 && (
                    <div className="order-actions">
                        {statusError && <div className="text-danger text-sm mb-2 text-right">{statusError}</div>}
                        <div className="d-flex gap-2">
                            {allowedTransitions.map(status => (
                                <button 
                                    key={status}
                                    className={`btn btn-${status === 'cancelled' ? 'outline text-danger' : 'primary'}`}
                                    onClick={() => handleStatusUpdate(status)}
                                    disabled={statusUpdating}
                                >
                                    Mark as {status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            <div className="admin-order-grid">
                {/* Main Content - Left Col */}
                <div className="admin-order-main">
                    <div className="admin-panel mb-6">
                        <div className="panel-header">
                            <h2 className="d-flex align-items-center gap-2">
                                <Package size={20} /> Order Items
                            </h2>
                        </div>
                        <div className="panel-body p-0">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th className="text-right">Price</th>
                                        <th className="text-center">Qty</th>
                                        <th className="text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="td-product">
                                                    <div className="td-img">
                                                        <img src={item.productImage} alt={item.productName} />
                                                    </div>
                                                    <div>
                                                        <span className="td-name">{item.productName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-right">${item.unitPrice.toFixed(2)}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-right"><strong>${item.lineTotal.toFixed(2)}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="order-summary-footer p-4 bg-light">
                                <div className="summary-row">
                                    <span>Subtotal:</span>
                                    <span>${order.subtotal.toFixed(2)}</span>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div className="summary-row text-success">
                                        <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                                        <span>-${order.discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="summary-row">
                                    <span>Shipping:</span>
                                    <span>${order.shippingCost.toFixed(2)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Tax:</span>
                                    <span>${order.tax.toFixed(2)}</span>
                                </div>
                                {order.razorpayPaymentId && (
                                    <div className="summary-row">
                                        <span className="text-muted">Payment ID</span>
                                        <span className="font-mono text-sm">{order.razorpayPaymentId}</span>
                                    </div>
                                )}
                                {order.paymentVerifiedAt && (
                                    <div className="summary-row">
                                        <span className="text-muted">Paid At</span>
                                        <span className="text-sm">{new Date(order.paymentVerifiedAt).toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="summary-row total-row">
                                    <span>Grand Total:</span>
                                    <span>${order.total.toFixed(2)} {order.currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AdminShipmentPanel order={order} onStatusChange={fetchData} />

                    <div className="admin-panel">
                        <div className="panel-header">
                            <h2 className="d-flex align-items-center gap-2">
                                <Clock size={20} /> Status History
                            </h2>
                        </div>
                        <div className="panel-body">
                            {history.length === 0 ? (
                                <p className="text-muted text-sm text-center">No status history found.</p>
                            ) : (
                                <div className="history-timeline">
                                    {history.map((log, i) => (
                                        <div key={log._id} className="history-item">
                                            <div className="history-dot"></div>
                                            <div className="history-content">
                                                <div className="history-meta text-xs text-muted">
                                                    {new Date(log.createdAt).toLocaleString()} by {log.adminNameSnapshot}
                                                </div>
                                                <div className="history-text">
                                                    Changed status: 
                                                    <span className="ml-1 text-muted">{log.previousStatus}</span> 
                                                    <span className="mx-1">→</span> 
                                                    <strong className="capitalize">{log.newStatus}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Right Col */}
                <div className="admin-order-sidebar">
                    <div className="admin-panel mb-6">
                        <div className="panel-header">
                            <h2 className="d-flex align-items-center gap-2">
                                <User size={20} /> Customer Info
                            </h2>
                        </div>
                        <div className="panel-body">
                            <div className="info-block mb-4">
                                <div className="info-label text-xs text-muted mb-1">Customer Name</div>
                                <div className="font-medium">{order.userId?.name || 'Unknown User'}</div>
                            </div>
                            <div className="info-block">
                                <div className="info-label text-xs text-muted mb-1">Email Address</div>
                                <div><a href={`mailto:${order.userId?.email}`} className="text-primary">{order.userId?.email}</a></div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-panel mb-6">
                        <div className="panel-header">
                            <h2 className="d-flex align-items-center gap-2">
                                <MapPin size={20} /> Shipping Address
                            </h2>
                        </div>
                        <div className="panel-body text-sm">
                            <div className="font-medium mb-1">{order.shippingAddress.fullName}</div>
                            {order.shippingAddress.addressLine1}<br/>
                            {order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br/></>}
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br/>
                            {order.shippingAddress.country}<br/>
                            <div className="mt-2 text-muted">Phone: {order.shippingAddress.phone}</div>
                        </div>
                    </div>

                    <div className="admin-panel mb-6">
                        <div className="panel-header">
                            <h2 className="d-flex align-items-center gap-2">
                                <CreditCard size={20} /> Payment Status
                            </h2>
                        </div>
                        <div className="panel-body">
                            <span className={`status-badge status-${order.paymentStatus.toLowerCase()}`}>
                                {order.paymentStatus.toUpperCase()}
                            </span>
                            {order.paymentStatus === 'pending' && (
                                <p className="text-xs text-muted mt-2">
                                    Payment must be confirmed by the payment gateway before fulfilling this order.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="admin-panel">
                        <div className="panel-header">
                            <h2 className="d-flex align-items-center gap-2">
                                <FileText size={20} /> Internal Notes
                            </h2>
                        </div>
                        <div className="panel-body p-0">
                            <div className="notes-list p-3">
                                {notes.length === 0 ? (
                                    <div className="text-center text-muted text-sm py-4">No internal notes.</div>
                                ) : (
                                    notes.map(note => (
                                        <div key={note._id} className="note-card bg-light p-3 mb-2 rounded">
                                            <div className="note-text text-sm mb-2">{note.note}</div>
                                            <div className="note-meta text-xs text-muted text-right">
                                                {note.adminNameSnapshot} - {new Date(note.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <form onSubmit={handleAddNote} className="add-note-form border-top p-3 bg-light">
                                <div className="d-flex gap-2">
                                    <input 
                                        type="text" 
                                        className="form-control text-sm" 
                                        placeholder="Add an internal note..." 
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        maxLength="2000"
                                    />
                                    <button type="submit" className="btn btn-primary p-2" disabled={!newNote.trim()}>
                                        <Send size={16} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetails;
