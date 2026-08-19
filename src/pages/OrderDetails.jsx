import { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useOrder } from '../hooks/useData';
import { orderService, paymentService, returnService } from '../services/apiService';
import { ArrowLeft, MapPin, Package, AlertCircle, CreditCard, XCircle, Headphones } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrderShipmentTracking from '../components/OrderShipmentTracking';
import './Orders.css';

const getStatusBadge = (status) => {
    const statusConfig = {
        pending_payment: { label: 'Pending Payment', class: 'status-warning' },
        processing: { label: 'Processing', class: 'status-info' },
        shipped: { label: 'Shipped', class: 'status-primary' },
        delivered: { label: 'Delivered', class: 'status-success' },
        cancelled: { label: 'Cancelled', class: 'status-error' }
    };
    const config = statusConfig[status] || { label: status, class: 'status-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
};

const OrderDetails = () => {
    const { orderNumber } = useParams();
    const navigate = useNavigate();
    const { data: order, loading, error, refetch } = useOrder(orderNumber);
    const [isCancelling, setIsCancelling] = useState(false);
    const location = useLocation();
    const [actionError, setActionError] = useState(location.state?.paymentError || null);
    const [isPaying, setIsPaying] = useState(false);
    const { user } = useAuth();

    const handleCancelOrder = async () => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        
        setIsCancelling(true);
        setActionError(null);
        try {
            await orderService.cancelOrder(orderNumber);
            refetch();
        } catch (err) {
            setActionError(err.message || 'Failed to cancel order. Please try again.');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleRetryPayment = async () => {
        setIsPaying(true);
        setActionError(null);
        try {
            const paymentInit = await paymentService.createPaymentOrder(orderNumber);
            
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || paymentInit.key,
                amount: paymentInit.amount,
                currency: paymentInit.currency,
                name: "Auralis Audio",
                description: `Order ${order.orderNumber}`,
                order_id: paymentInit.razorpayOrderId,
                handler: async function (response) {
                    try {
                        const verificationResult = await paymentService.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderNumber: order.orderNumber
                        });
                        
                        if (verificationResult.inventoryIssue) {
                            setActionError(verificationResult.message || 'Payment succeeded but an inventory issue occurred.');
                        }
                        
                        refetch();
                    } catch (err) {
                        setActionError(err.message || 'Payment verification failed. Please check your order history or contact support.');
                    }
                },
                prefill: {
                    name: user?.name || order.shippingAddress.fullName,
                    email: user?.email || '',
                    contact: order.shippingAddress.phone
                },
                theme: {
                    color: "#4F46E5"
                },
                modal: {
                    ondismiss: function() {
                        setIsPaying(false);
                    }
                }
            };
            
            const rzp = new window.Razorpay(options);
            
            rzp.on('payment.failed', function (response){
                setIsPaying(false);
                setActionError(response.error.description || 'Payment failed. Please try a different payment method.');
            });
            
            rzp.open();
        } catch (err) {
            setActionError(err.message || 'Failed to initiate payment. Please try again.');
            setIsPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="section container">
                <div className="skeleton-order" style={{ height: '400px' }}></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="section container">
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ marginBottom: '1.5rem', color: 'var(--color-slate-600)' }}>
                        <AlertCircle size={48} style={{ margin: '0 auto 1rem auto', color: 'var(--color-danger)' }} />
                        <h2 style={{ marginBottom: '0.5rem', color: 'var(--color-slate-900)' }}>Order Not Found</h2>
                        <p>{error || 'We couldnt locate this order.'}</p>
                    </div>
                    <Link to="/orders" className="btn btn-primary">Back to Orders</Link>
                </div>
            </div>
        );
    }

    const canCancel = ['pending_payment', 'processing'].includes(order.orderStatus);
    const canReturn = ['shipped', 'delivered'].includes(order.orderStatus) && order.paymentStatus === 'paid';

    return (
        <div className="section container order-details-page">
            <button onClick={() => navigate('/orders')} className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', border: 'none', padding: 0 }}>
                <ArrowLeft size={18} /> Back to Orders
            </button>

            <div className="order-details-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Order #{order.orderNumber}</h1>
                    <p className="text-muted">Placed on {new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="order-status-badges">
                    {getStatusBadge(order.orderStatus)}
                    <span className={`status-badge ${order.paymentStatus === 'paid' ? 'status-success' : 'status-warning'}`}>
                        Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                </div>
            </div>

            {actionError && (
                <div className="error-state" style={{ marginBottom: '1.5rem', fontSize: '0.875rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} /> {actionError}
                </div>
            )}

            <div className="order-details-grid">
                <div className="order-items-section">
                    <h2 className="section-title"><Package size={20} /> Order Items</h2>
                    <div className="order-items-list">
                        {order.items.map(item => (
                            <div key={item.productId} className="order-item-row">
                                <div className="item-image-wrapper">
                                    <img src={item.productImage} alt={item.productName} />
                                </div>
                                <div className="item-info">
                                    <Link to={`/product/${item.productId}`} className="item-name">{item.productName}</Link>
                                    <div className="item-meta">
                                        <span className="qty">Qty: {item.quantity}</span>
                                        <span className="price">₹{item.unitPrice.toLocaleString()} each</span>
                                    </div>
                                </div>
                                <div className="item-total-price">
                                    ₹{item.lineTotal.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <OrderShipmentTracking orderNumber={order.orderNumber} />

                <div className="order-sidebar">
                    <div className="order-summary-card" style={{ marginBottom: '1.5rem' }}>
                        <h2 className="section-title">Summary</h2>
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹{order.subtotal.toLocaleString()}</span>
                        </div>
                        {order.discountAmount > 0 && (
                            <div className="summary-row text-success">
                                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                                <span>-₹{order.discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="summary-row">
                            <span>Shipping</span>
                            <span>{order.shippingCost === 0 ? 'Free' : `₹${order.shippingCost.toFixed(2)}`}</span>
                        </div>
                        <div className="summary-row">
                            <span>Tax</span>
                            <span>₹{order.tax.toFixed(2)}</span>
                        </div>
                        <div className="summary-row total-row">
                            <span>Total</span>
                            <span>₹{order.total.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="order-shipping-card" style={{ marginBottom: '1.5rem' }}>
                        <h2 className="section-title"><MapPin size={20} /> Shipping Address</h2>
                        <div className="shipping-address-display">
                            <p className="font-semibold">{order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.addressLine1}</p>
                            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.country}</p>
                            <p className="phone text-muted" style={{ marginTop: '0.5rem' }}>{order.shippingAddress.phone}</p>
                        </div>
                    </div>

                    <div className="order-actions-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {order.paymentStatus === 'pending' && canCancel && (
                            <button 
                                className="btn btn-primary"
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}
                                onClick={handleRetryPayment}
                                disabled={isPaying || isCancelling}
                            >
                                <CreditCard size={18} />
                                {isPaying ? 'Processing...' : 'Pay Now'}
                            </button>
                        )}
                        {canCancel && (
                            <button 
                                className="btn btn-outline text-danger"
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                onClick={handleCancelOrder}
                                disabled={isCancelling || isPaying}
                            >
                                <XCircle size={18} />
                                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                        )}
                        {canReturn && (
                            <Link 
                                to={`/account/returns/${order.orderNumber}/request`}
                                className="btn btn-outline"
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Package size={18} />
                                Request Return
                            </Link>
                        )}
                        <Link 
                            to="/account/support"
                            state={{ prefillOrder: order.orderNumber }}
                            className="btn btn-outline"
                            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Headphones size={18} />
                            Contact Support
                        </Link>
                        {(canCancel || canReturn) && (
                            <p className="text-muted" style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem' }}>
                                {canReturn ? 'You can request a return within the eligible return window.' : 'You can cancel this order because it has not shipped yet.'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
