import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loyaltyService } from '../services/apiService';
import { ArrowLeft, Award, Clock, ArrowUpRight, ArrowDownRight, RefreshCcw, FileText } from 'lucide-react';
import { EmptyState } from '../components/States';

const Loyalty = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLoyalty = async (p = 1) => {
        try {
            setLoading(true);
            const data = await loyaltyService.getMyLoyalty(p);
            setBalance(data.balance);
            setTransactions(data.transactions);
            setTotalPages(data.pagination.pages);
        } catch (err) {
            setError(err.message || 'Failed to fetch loyalty data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoyalty(page);
    }, [page]);

    const getIcon = (type, points) => {
        if (points > 0) return <ArrowUpRight style={{ color: 'var(--color-success)' }} size={20} />;
        if (points < 0) return <ArrowDownRight style={{ color: 'var(--color-danger)' }} size={20} />;
        return <RefreshCcw style={{ color: 'var(--color-slate-400)' }} size={20} />;
    };

    const getLabel = (type) => {
        switch (type) {
            case 'EARN': return 'Earned Points';
            case 'REDEEM': return 'Redeemed Points';
            case 'REFUND_REVERSAL': return 'Refund Reversal';
            case 'CANCELLATION_REVERSAL': return 'Cancellation Reversal';
            case 'ADMIN_ADJUSTMENT': return 'Account Adjustment';
            case 'EXPIRATION': return 'Points Expired';
            default: return type;
        }
    };

    return (
        <div className="section container">
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--spacing-lg) 0' }}>
                <button onClick={() => navigate('/account')} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-lg)', border: 'none', padding: 0 }}>
                    <ArrowLeft size={16} /> Back to Account
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-md)' }}>
                    <h1 style={{ fontSize: 'var(--font-size-3xl)', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <Award className="text-primary" size={32} /> Auralis Rewards
                    </h1>
                </div>

                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)' }}>
                        {error}
                    </div>
                )}

                <div style={{ 
                    backgroundColor: 'var(--color-surface)', 
                    padding: 'var(--spacing-xl)', 
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    marginBottom: 'var(--spacing-xl)',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <p style={{ color: 'var(--color-slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem' }}>Available Balance</p>
                    <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--color-primary)', lineHeight: 1 }}>
                        {balance}
                    </div>
                    <p style={{ color: 'var(--color-slate-400)', marginTop: '0.5rem' }}>Points</p>
                </div>

                <div style={{ 
                    backgroundColor: 'var(--color-surface)', 
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={20} className="text-slate-400"/>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Transaction History</h2>
                    </div>

                    {loading ? (
                        <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-slate-400)' }}>
                            Loading ledger...
                        </div>
                    ) : transactions.length === 0 ? (
                        <div style={{ padding: 'var(--spacing-xl)' }}>
                            <EmptyState 
                                icon={FileText}
                                title="No transactions yet"
                                message="Your loyalty transaction history will appear here once you start earning or redeeming points."
                            />
                        </div>
                    ) : (
                        <div>
                            {transactions.map(tx => (
                                <div key={tx._id} style={{ 
                                    padding: 'var(--spacing-md) var(--spacing-lg)', 
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ 
                                            width: '40px', height: '40px', borderRadius: '50%', 
                                            backgroundColor: 'var(--color-slate-50)', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {getIcon(tx.type, tx.points)}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '500', color: 'var(--color-slate-900)', margin: 0 }}>{getLabel(tx.type)}</p>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-400)', margin: 0 }}>
                                                {tx.source} • {new Date(tx.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ 
                                            fontWeight: 'bold', margin: 0,
                                            color: tx.points > 0 ? 'var(--color-success)' : (tx.points < 0 ? 'var(--color-danger)' : 'var(--color-slate-400)')
                                        }}>
                                            {tx.points > 0 ? '+' : ''}{tx.points}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {totalPages > 1 && (
                                <div style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'center', gap: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                    <button 
                                        className="btn btn-outline btn-sm" 
                                        disabled={page === 1}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        Previous
                                    </button>
                                    <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
                                        Page {page} of {totalPages}
                                    </span>
                                    <button 
                                        className="btn btn-outline btn-sm" 
                                        disabled={page === totalPages}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Loyalty;
