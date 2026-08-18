import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { returnService } from '../services/apiService';
import { Package, ArrowLeft, RotateCcw } from 'lucide-react';

const Returns = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReturns = async () => {
            try {
                const data = await returnService.getMyReturns();
                setReturns(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReturns();
    }, []);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'requested': return 'badge-warning';
            case 'approved': return 'badge-info';
            case 'received': return 'badge-primary';
            case 'refund_pending': return 'badge-info';
            case 'refunded': return 'badge-success';
            case 'rejected': return 'badge-danger';
            case 'cancelled': return 'badge-secondary';
            default: return 'badge-secondary';
        }
    };

    if (loading) {
        return (
            <div className="section container" style={{ minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="section container" style={{ minHeight: '70vh' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 0' }}>
                <Link to="/account" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                    <ArrowLeft size={16} /> Back to Account
                </Link>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>My Returns</h1>
                </div>

                {error && (
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', marginBottom: '2rem' }}>
                        {error}
                    </div>
                )}

                {returns.length === 0 && !error ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '4rem 2rem', 
                        backgroundColor: 'rgba(255,255,255,0.02)', 
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <RotateCcw size={48} color="var(--color-slate-500)" style={{ margin: '0 auto 1rem' }} />
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-slate-300)' }}>No Returns Yet</h2>
                        <p style={{ color: 'var(--color-slate-400)', marginBottom: '1.5rem' }}>You haven't requested any returns.</p>
                        <Link to="/orders" className="btn btn-outline">View Orders</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {returns.map(req => (
                            <div key={req._id} style={{ 
                                backgroundColor: 'rgba(255,255,255,0.02)', 
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                padding: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Return Request for Order {req.orderNumber}</h3>
                                            <span className={`badge ${getStatusBadgeClass(req.status)}`} style={{ textTransform: 'capitalize' }}>
                                                {req.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div style={{ color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
                                            Requested on {new Date(req.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '500', color: 'var(--color-indigo)' }}>
                                            ₹{req.refundAmount.toFixed(2)}
                                        </div>
                                        <div style={{ color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
                                            Expected Refund
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                    <h4 style={{ fontSize: '0.875rem', color: 'var(--color-slate-300)', marginBottom: '0.5rem' }}>Items to Return:</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {req.items.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                                <span>Product ID: {item.productId}</span>
                                                <span style={{ color: 'var(--color-slate-400)' }}>Qty: {item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Returns;
