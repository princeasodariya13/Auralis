import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { returnService } from '../services/apiService';
import { Package, ArrowLeft, RotateCcw } from 'lucide-react';
import { EmptyState, ErrorState } from '../components/States';

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
    
    if (error) {
        return (
            <div className="section container">
                <ErrorState message={error} onRetry={() => window.location.reload()} />
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

                {returns.length === 0 ? (
                    <EmptyState 
                        icon={RotateCcw}
                        title="No Returns Yet"
                        message="You haven't requested any returns."
                        actionText="View Orders"
                        onAction={() => window.location.href = '/orders'}
                    />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {returns.map(req => (
                            <div key={req._id} style={{ 
                                backgroundColor: 'var(--color-surface)', 
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                padding: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                boxShadow: 'var(--shadow-sm)'
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
                                
                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                                    <h4 style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)', marginBottom: '0.5rem' }}>Items to Return:</h4>
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
