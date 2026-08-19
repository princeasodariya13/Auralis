import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCheckoutPreview } from '../hooks/useData';
import { orderService, paymentService, loyaltyService } from '../services/apiService';
import AddressManager from '../components/AddressManager';
import { AlertCircle, ArrowLeft, CheckCircle2, ShoppingBag, Award } from 'lucide-react';
import './Checkout.css';

const Checkout = () => {
    const navigate = useNavigate();
    const { cart, clearCart } = useCart();
    const { user } = useAuth();
    
    // Redirect if cart is empty
    useEffect(() => {
        if (!cart || cart.length === 0) {
            navigate('/cart');
        } else {
            // Log Analytics: Checkout Started
            import('../services/apiService').then(mod => {
                mod.analyticsService.logEvent('CHECKOUT_STARTED');
            });
        }
    }, [cart, navigate]);

    const [refreshKey, setRefreshKey] = useState(0);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState('');
    const [couponError, setCouponError] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    
    // Loyalty State
    const [pointsToRedeem, setPointsToRedeem] = useState('');
    const [appliedPoints, setAppliedPoints] = useState(0);
    const [availablePoints, setAvailablePoints] = useState(0);

    useEffect(() => {
        const fetchPoints = async () => {
            try {
                const loyaltyData = await loyaltyService.getMyLoyalty(1, 1);
                setAvailablePoints(loyaltyData.availablePoints || 0);
            } catch (err) {
                console.error("Failed to fetch available points", err);
            }
        };
        fetchPoints();
    }, []);
    
    // Pass appliedCoupon and appliedPoints to the hook
    const { data: preview, loading: previewLoading, error: previewError } = useCheckoutPreview(refreshKey, appliedCoupon, appliedPoints);
    
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [orderError, setOrderError] = useState(null);
    const [successOrder, setSuccessOrder] = useState(null);

    const handleCreateOrder = async () => {
        if (!selectedAddress) {
            setOrderError("Please select a shipping address.");
            return;
        }

        setOrderError(null);
        setIsCreatingOrder(true);
        
        try {
            const order = await orderService.createOrder(selectedAddress._id, appliedCoupon, appliedPoints);
            
            // Initiate Razorpay Flow
            const paymentInit = await paymentService.createPaymentOrder(order.orderNumber);
            
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || paymentInit.key,
                amount: paymentInit.amount,
                currency: paymentInit.currency,
                name: "Auralis Audio",
                description: `Order ${order.orderNumber}`,
                order_id: paymentInit.razorpayOrderId,
                handler: async function (response) {
                    try {
                        setIsCreatingOrder(true);
                        const verificationResult = await paymentService.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderNumber: order.orderNumber
                        });
                        
                        await clearCart(); // Refresh cart to clear it locally (backend already cleared it)
                        
                        // We still set success order, but check if inventory issue happened
                        if (verificationResult.inventoryIssue) {
                            setOrderError(verificationResult.message);
                        }
                        
                        setSuccessOrder(order);
                    } catch (err) {
                        setOrderError(err.message || 'Payment verification failed');
                    } finally {
                        setIsCreatingOrder(false);
                    }
                },
                prefill: {
                    name: user?.name || selectedAddress.fullName,
                    email: user?.email || '',
                    contact: selectedAddress.phone
                },
                theme: {
                    color: "#4F46E5"
                },
                modal: {
                    ondismiss: function() {
                        // User closed the modal
                        setIsCreatingOrder(false);
                        setOrderError('Payment cancelled. Your order has been saved and can be paid from your order history.');
                        // We can set successOrder if we want them to see the order created page
                        navigate(`/orders/${order.orderNumber}`, { state: { paymentError: 'Payment was cancelled. Your order is saved and you can try paying again.' } });
                    }
                }
            };
            
            const rzp = new window.Razorpay(options);
            
            rzp.on('payment.failed', function (response){
                setIsCreatingOrder(false);
                navigate(`/orders/${order.orderNumber}`, { state: { paymentError: response.error.description || 'Your payment could not be completed. No changes were made to your order status.' } });
            });
            
            rzp.open();
            
        } catch (error) {
            setOrderError(error.message || "Failed to create order. Please try again.");
            // If the error was due to price changes, we can refresh the preview
            if (error.message.includes('changed') || error.message.includes('available')) {
                setRefreshKey(prev => prev + 1);
            }
        } finally {
            setIsCreatingOrder(false);
        }
    };

    if (successOrder) {
        return (
            <div className="section container">
                <div className="checkout-success">
                    <CheckCircle2 size={64} color="var(--color-primary)" />
                    <h2>Order Created</h2>
                    <p>Your order number is <strong>{successOrder.orderNumber}</strong></p>
                    <p className="text-muted mt-4">
                        Thank you for your purchase. We are processing your order.
                    </p>
                    <div className="mt-8" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={() => navigate(`/orders/${successOrder.orderNumber}`)}>
                            View Order
                        </button>
                        <button className="btn btn-outline" onClick={() => navigate('/shop')}>
                            Back to Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!cart || cart.length === 0) return null; // Wait for redirect

    return (
        <div className="section container checkout-page">
            <button onClick={() => navigate('/cart')} className="back-btn mb-6">
                <ArrowLeft size={18} /> Back to Cart
            </button>

            <h1 className="mb-8">Checkout</h1>

            {orderError && (
                <div className="checkout-error mb-6">
                    <AlertCircle size={20} />
                    <span>{orderError}</span>
                </div>
            )}

            <div className="checkout-layout">
                {/* Left Column: Addresses */}
                <div className="checkout-left">
                    <div className="checkout-section">
                        <h2>1. Shipping Address</h2>
                        <AddressManager 
                            selectionMode={true} 
                            selectedAddressId={selectedAddress?._id}
                            onSelectAddress={setSelectedAddress}
                        />
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="checkout-right">
                    <div className="checkout-section order-summary-section">
                        <h2>Order Summary</h2>
                        
                        {previewLoading ? (
                            <div className="loading-state">Calculating totals...</div>
                        ) : previewError ? (
                            <div className="error-state" style={{ padding: '1rem', textAlign: 'center' }}>
                                <AlertCircle size={24} color="#dc2626" style={{ margin: '0 auto 0.5rem auto' }} />
                                <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{previewError}</p>
                                <button className="btn btn-outline" onClick={() => navigate('/cart')}>
                                    Return to Cart
                                </button>
                            </div>
                        ) : preview ? (
                            <>
                                <div className="summary-items">
                                    {preview.items.map(item => (
                                        <div key={item.productId} className="summary-item">
                                            <div className="summary-item-info">
                                                <span className="qty">{item.quantity}x</span>
                                                <span className="name">{item.productName}</span>
                                            </div>
                                            <span className="price">₹{item.lineTotal.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="summary-totals">
                                    <div className="summary-row">
                                        <span>Subtotal</span>
                                        <span>₹{preview.subtotal.toLocaleString()}</span>
                                    </div>
                                    
                                    {preview.discountAmount > 0 && (
                                        <div className="summary-row text-success">
                                            <span>Discount {preview.coupon?.code ? `(${preview.coupon.code})` : ''}</span>
                                            <span>-₹{preview.discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    {preview.loyaltyDiscount > 0 && (
                                        <div className="summary-row text-primary">
                                            <span>Loyalty Rewards ({preview.loyaltyPointsRedeemed} pts)</span>
                                            <span>-₹{preview.loyaltyDiscount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="summary-row">
                                        <span>Shipping</span>
                                        <span>{preview.shippingCost === 0 ? 'Free' : `₹${preview.shippingCost.toFixed(2)}`}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Estimated Tax</span>
                                        <span>₹{preview.tax.toFixed(2)}</span>
                                    </div>
                                    <div className="summary-row total-row">
                                        <span>Total</span>
                                        <span>₹{preview.total.toLocaleString()}</span>
                                    </div>
                                </div>
                                
                                {/* Coupon Input Form */}
                                <div className="coupon-section mt-4 mb-4">
                                    {appliedCoupon ? (
                                        <div className="applied-coupon" style={{ backgroundColor: 'var(--color-slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px dashed var(--color-border)' }}>
                                            <div>
                                                <span className="font-semibold text-success">✓ Coupon Applied:</span>
                                                <span className="font-mono" style={{ marginLeft: '0.5rem' }}>{appliedCoupon}</span>
                                            </div>
                                            <button 
                                                className="btn-outline" 
                                                style={{ color: 'var(--color-danger)', border: 'none', background: 'none', padding: 0, textDecoration: 'underline' }}
                                                onClick={() => {
                                                    setAppliedCoupon('');
                                                    setCouponCode('');
                                                    setCouponError('');
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="coupon-form">
                                            <div className="form-group" style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', marginBottom: 0 }}>
                                                <input 
                                                    type="text" 
                                                    className="form-control"
                                                    placeholder="Discount code" 
                                                    value={couponCode}
                                                    onChange={(e) => {
                                                        setCouponCode(e.target.value.toUpperCase());
                                                        setCouponError('');
                                                    }}
                                                />
                                                <button 
                                                    className="btn btn-outline"
                                                    disabled={!couponCode.trim() || isApplyingCoupon}
                                                    onClick={async () => {
                                                        if (!couponCode.trim()) return;
                                                        setIsApplyingCoupon(true);
                                                        setCouponError('');
                                                        try {
                                                            // the preview hook will handle the refresh, we just need to set the state
                                                            setAppliedCoupon(couponCode);
                                                        } catch (err) {
                                                            setCouponError(err.message);
                                                        } finally {
                                                            setIsApplyingCoupon(false);
                                                        }
                                                    }}
                                                >
                                                    {isApplyingCoupon ? '...' : 'Apply'}
                                                </button>
                                            </div>
                                            {couponError && <p className="text-danger text-sm mt-2">{couponError}</p>}
                                        </div>
                                    )}
                                </div>

                                {/* Loyalty Points Section */}
                                {availablePoints > 0 && (
                                    <div className="loyalty-section mt-4 mb-4">
                                        <div className="d-flex align-items-center mb-2" style={{ gap: '0.5rem' }}>
                                            <Award size={18} className="text-primary" />
                                            <span className="font-semibold text-primary">Auralis Rewards</span>
                                        </div>
                                        <p className="text-sm text-muted mb-3">You have <strong>{availablePoints}</strong> available points.</p>
                                        
                                        {appliedPoints > 0 ? (
                                            <div className="applied-coupon" style={{ backgroundColor: 'var(--color-slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px dashed var(--color-border)' }}>
                                                <div>
                                                    <span className="font-semibold text-primary">✓ Points Applied:</span>
                                                    <span className="font-mono" style={{ marginLeft: '0.5rem' }}>{appliedPoints}</span>
                                                </div>
                                                <button 
                                                    className="btn-outline" 
                                                    style={{ color: 'var(--color-danger)', border: 'none', background: 'none', padding: 0, textDecoration: 'underline' }}
                                                    onClick={() => {
                                                        setAppliedPoints(0);
                                                        setPointsToRedeem('');
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="coupon-form">
                                                <div className="form-group" style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', marginBottom: 0 }}>
                                                    <input 
                                                        type="number" 
                                                        className="form-control"
                                                        placeholder="Points to redeem" 
                                                        value={pointsToRedeem}
                                                        max={availablePoints}
                                                        onChange={(e) => setPointsToRedeem(e.target.value)}
                                                    />
                                                    <button 
                                                        className="btn btn-outline"
                                                        disabled={!pointsToRedeem || parseInt(pointsToRedeem) <= 0 || parseInt(pointsToRedeem) > availablePoints}
                                                        onClick={() => {
                                                            const pts = parseInt(pointsToRedeem);
                                                            if (pts > 0 && pts <= availablePoints) {
                                                                setAppliedPoints(pts);
                                                            }
                                                        }}
                                                    >
                                                        Redeem
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button 
                                    className="btn btn-primary w-full mt-6 flex justify-center items-center gap-2"
                                    onClick={handleCreateOrder}
                                    disabled={!selectedAddress || isCreatingOrder}
                                >
                                    {isCreatingOrder ? 'Processing...' : 'Continue to Payment'}
                                </button>
                                
                                {!selectedAddress && (
                                    <p className="text-sm text-center text-muted mt-4">
                                        Please select a shipping address to continue.
                                    </p>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
