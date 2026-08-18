import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { returnService } from '../services/apiService';
import { AlertCircle, ArrowLeft, PackageCheck } from 'lucide-react';

const ReturnRequestForm = () => {
    const { orderNumber } = useParams();
    const navigate = useNavigate();
    const [eligibility, setEligibility] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItems, setSelectedItems] = useState({});
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const checkEligibility = async () => {
            try {
                const data = await returnService.getEligibility(orderNumber);
                setEligibility(data);
                
                // Initialize selection state
                if (data.eligible && data.items) {
                    const initial = {};
                    data.items.forEach(item => {
                        if (item.returnableQuantity > 0) {
                            initial[item.productId] = 0; // Default to 0 selected
                        }
                    });
                    setSelectedItems(initial);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        checkEligibility();
    }, [orderNumber]);

    const handleQtyChange = (productId, qty) => {
        setSelectedItems(prev => ({
            ...prev,
            [productId]: qty
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const itemsToReturn = Object.entries(selectedItems)
            .filter(([_, qty]) => qty > 0)
            .map(([productId, quantity]) => ({
                productId: Number(productId),
                quantity: Number(quantity)
            }));

        if (itemsToReturn.length === 0) {
            setError('Please select at least one item to return');
            return;
        }

        if (!reason) {
            setError('Please provide a reason for the return');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await returnService.createReturnRequest({
                orderNumber,
                items: itemsToReturn,
                reason,
                customerNote: note
            });
            setSuccess(true);
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="section container" style={{ minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="section container" style={{ minHeight: '60vh' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '4rem 1rem' }}>
                    <PackageCheck size={64} color="var(--color-indigo)" style={{ margin: '0 auto 1.5rem' }} />
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Return Requested</h1>
                    <p style={{ color: 'var(--color-slate-400)', marginBottom: '2rem', lineHeight: 1.6 }}>
                        Your return request for order <strong>{orderNumber}</strong> has been successfully submitted. 
                        Our team will review it shortly. You can track its status in your account.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button onClick={() => navigate('/account/returns')} className="btn btn-primary">
                            View My Returns
                        </button>
                        <button onClick={() => navigate('/orders')} className="btn btn-outline">
                            Back to Orders
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!eligibility?.eligible) {
        return (
            <div className="section container" style={{ minHeight: '60vh' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem 0' }}>
                    <button onClick={() => navigate(`/orders/${orderNumber}`)} className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                        <ArrowLeft size={16} /> Back to Order
                    </button>
                    
                    <div style={{ 
                        backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2rem',
                        textAlign: 'center'
                    }}>
                        <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Return Not Available</h2>
                        <p style={{ color: 'var(--color-slate-300)' }}>
                            {eligibility?.reason || error || 'This order is not eligible for a return.'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="section container" style={{ minHeight: '60vh' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
                <button onClick={() => navigate(`/orders/${orderNumber}`)} className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                    <ArrowLeft size={16} /> Back to Order
                </button>

                <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Request a Return</h1>

                {error && (
                    <div style={{ 
                        padding: '1rem', 
                        backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                        borderRadius: 'var(--radius-md)',
                        color: '#ef4444',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ 
                        backgroundColor: 'rgba(255,255,255,0.02)', 
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        padding: '2rem',
                        marginBottom: '2rem'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Select Items to Return</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {eligibility.items.map(item => (
                                <div key={item.productId} style={{ 
                                    display: 'flex', 
                                    gap: '1rem', 
                                    padding: '1rem',
                                    backgroundColor: 'rgba(255,255,255,0.01)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgba(255,255,255,0.03)',
                                    alignItems: 'center'
                                }}>
                                    <img 
                                        src={item.productImage} 
                                        alt={item.productName} 
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1rem', margin: '0 0 0.25rem 0' }}>{item.productName}</h3>
                                        <div style={{ color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
                                            Price: ${item.unitPrice.toFixed(2)}
                                        </div>
                                        <div style={{ color: 'var(--color-slate-400)', fontSize: '0.875rem' }}>
                                            Returnable: {item.returnableQuantity} (of {item.purchasedQuantity} purchased)
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <label style={{ fontSize: '0.875rem', color: 'var(--color-slate-300)' }}>Qty to Return:</label>
                                        <select 
                                            value={selectedItems[item.productId] || 0}
                                            onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value))}
                                            style={{
                                                padding: '0.5rem',
                                                backgroundColor: 'var(--color-slate-900)',
                                                border: '1px solid var(--color-slate-700)',
                                                color: 'var(--color-white)',
                                                borderRadius: '4px',
                                                width: '70px'
                                            }}
                                            disabled={item.returnableQuantity === 0}
                                        >
                                            {[...Array(item.returnableQuantity + 1).keys()].map(num => (
                                                <option key={num} value={num}>{num}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ 
                        backgroundColor: 'rgba(255,255,255,0.02)', 
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        padding: '2rem',
                        marginBottom: '2rem'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Return Details</h2>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-slate-300)' }}>
                                Reason for Return *
                            </label>
                            <select 
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--color-slate-900)',
                                    border: '1px solid var(--color-slate-700)',
                                    color: 'var(--color-white)',
                                    borderRadius: '4px'
                                }}
                                required
                            >
                                <option value="">Select a reason</option>
                                <option value="defective">Item is defective or broken</option>
                                <option value="wrong_item">Received wrong item</option>
                                <option value="not_as_described">Item not as described</option>
                                <option value="changed_mind">Changed my mind</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-slate-300)' }}>
                                Additional Details (Optional)
                            </label>
                            <textarea 
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--color-slate-900)',
                                    border: '1px solid var(--color-slate-700)',
                                    color: 'var(--color-white)',
                                    borderRadius: '4px',
                                    minHeight: '100px',
                                    resize: 'vertical'
                                }}
                                placeholder="Please provide any additional details that might help us process your return."
                            />
                        </div>
                    </div>

                    <div style={{ 
                        backgroundColor: 'rgba(79, 70, 229, 0.05)', 
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgba(79, 70, 229, 0.2)',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem'
                    }}>
                        <InfoIcon />
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-slate-300)', lineHeight: 1.6 }}>
                            <strong>Refund Information:</strong> The exact refund amount will be calculated by our system based on your original purchase price, proportional discounts applied, and tax. Shipping fees are non-refundable. The final amount will be verified during processing.
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button 
                            type="button" 
                            onClick={() => navigate(`/orders/${orderNumber}`)} 
                            className="btn btn-outline"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={submitting || Object.values(selectedItems).every(q => q === 0)}
                        >
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

export default ReturnRequestForm;
