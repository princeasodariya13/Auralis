import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../../services/apiService';
import { ArrowLeft, Check, X, RotateCcw, DollarSign } from 'lucide-react';
import './AdminOrders.css';

const AdminReturnDetails = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [restockItems, setRestockItems] = useState(true);

    const fetchDetails = async () => {
        try {
            const res = await adminService.getReturnDetails(id);
            setData(res);
            setAdminNote(res.returnRequest.adminNote || '');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleStatusUpdate = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this request as ${newStatus}?`)) return;
        
        setActionLoading(true);
        try {
            await adminService.updateReturnStatus(id, { 
                status: newStatus,
                adminNote,
                restockItems: newStatus === 'received' ? restockItems : undefined
            });
            await fetchDetails(); // Refresh
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="admin-loading"><div className="spinner"></div></div>;
    if (error) return <div className="admin-error">{error}</div>;
    if (!data) return null;

    const req = data.returnRequest;
    const order = data.orderSnapshot;

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/admin/returns" className="btn-icon">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="admin-title">Return Request Details</h1>
                </div>
            </div>

            <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="admin-main">
                    <div className="admin-card">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Request Information</h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', color: 'var(--color-slate-400)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Return ID</label>
                                <div>{req._id}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--color-slate-400)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Original Order No</label>
                                <div>
                                    <Link to={`/admin/orders/${req.orderNumber}`} style={{ color: 'var(--color-indigo)', textDecoration: 'none' }}>
                                        {req.orderNumber}
                                    </Link>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--color-slate-400)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Current Status</label>
                                <span className={`status-badge ${req.status === 'requested' ? 'warning' : req.status === 'refunded' ? 'success' : 'primary'}`} style={{ textTransform: 'capitalize' }}>
                                    {req.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'var(--color-slate-400)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Requested Date</label>
                                <div>{new Date(req.createdAt).toLocaleString()}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                            <label style={{ display: 'block', color: 'var(--color-slate-400)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Customer Reason</label>
                            <div style={{ fontWeight: '500', textTransform: 'capitalize', marginBottom: '0.5rem' }}>
                                {req.reason.replace('_', ' ')}
                            </div>
                            {req.customerNote && (
                                <div style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--color-slate-300)' }}>
                                    "{req.customerNote}"
                                </div>
                            )}
                        </div>

                        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Items to Return</h3>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU / ID</th>
                                    <th>Qty Returned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {req.items.map((item, idx) => {
                                    // Find original item for context if possible
                                    const original = order?.items?.find(i => i.productId === item.productId);
                                    return (
                                        <tr key={idx}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    {original?.productImage && (
                                                        <img src={original.productImage} alt="Product" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                                    )}
                                                    <span>{original?.productName || 'Unknown Product'}</span>
                                                </div>
                                            </td>
                                            <td>{item.productId}</td>
                                            <td>{item.quantity} {original && `(of ${original.quantity})`}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="admin-sidebar">
                    <div className="admin-card">
                        <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Financials</h2>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--color-slate-400)' }}>Order Total:</span>
                            <span>₹{order?.total.toFixed(2) || '0.00'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ color: 'var(--color-slate-400)' }}>Calculated Refund:</span>
                            <span style={{ color: 'var(--color-indigo)', fontWeight: 'bold' }}>₹{req.refundAmount.toFixed(2)}</span>
                        </div>
                        
                        {req.refundReference && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', color: 'var(--color-slate-400)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Refund Ref (Razorpay)</label>
                                <div style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>{req.refundReference}</div>
                            </div>
                        )}

                        <h2 style={{ fontSize: '1.125rem', margin: '1.5rem 0 1rem 0' }}>Admin Actions</h2>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', color: 'var(--color-slate-400)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Admin Note (Internal/Customer)</label>
                            <textarea 
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                className="admin-input"
                                rows="3"
                                placeholder="Add notes before updating status"
                            />
                        </div>

                        {req.status === 'requested' && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                <button 
                                    className="btn btn-primary" 
                                    style={{ width: '100%', justifyContent: 'center' }}
                                    onClick={() => handleStatusUpdate('approved')}
                                    disabled={actionLoading}
                                >
                                    <Check size={16} style={{ marginRight: '0.5rem' }} /> Approve Return
                                </button>
                                <button 
                                    className="btn btn-outline" 
                                    style={{ width: '100%', justifyContent: 'center', borderColor: '#ef4444', color: '#ef4444' }}
                                    onClick={() => handleStatusUpdate('rejected')}
                                    disabled={actionLoading}
                                >
                                    <X size={16} style={{ marginRight: '0.5rem' }} /> Reject Return
                                </button>
                            </div>
                        )}

                        {req.status === 'approved' && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input 
                                        type="checkbox" 
                                        id="restock" 
                                        checked={restockItems} 
                                        onChange={(e) => setRestockItems(e.target.checked)}
                                    />
                                    <label htmlFor="restock" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Restock Inventory</label>
                                </div>
                                <button 
                                    className="btn btn-primary" 
                                    style={{ width: '100%', justifyContent: 'center' }}
                                    onClick={() => handleStatusUpdate('received')}
                                    disabled={actionLoading}
                                >
                                    <RotateCcw size={16} style={{ marginRight: '0.5rem' }} /> Mark as Received
                                </button>
                            </div>
                        )}

                        {req.status === 'received' && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                <button 
                                    className="btn btn-primary" 
                                    style={{ width: '100%', justifyContent: 'center', backgroundColor: '#10b981', borderColor: '#10b981' }}
                                    onClick={() => handleStatusUpdate('refunded')}
                                    disabled={actionLoading}
                                >
                                    <DollarSign size={16} style={{ marginRight: '0.5rem' }} /> Execute Razorpay Refund
                                </button>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', textAlign: 'center' }}>
                                    This will permanently refund ₹{req.refundAmount.toFixed(2)} to the customer.
                                </div>
                            </div>
                        )}
                        
                        {(req.status === 'refunded' || req.status === 'rejected' || req.status === 'cancelled') && (
                            <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', textAlign: 'center', color: 'var(--color-slate-400)' }}>
                                No further actions available for this state.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReturnDetails;
