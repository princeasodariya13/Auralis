import { useState, useEffect } from 'react';
import { Truck, ExternalLink, MapPin, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { orderService } from '../services/apiService';
import './OrderShipmentTracking.css';

const OrderShipmentTracking = ({ orderNumber }) => {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShipments = async () => {
            try {
                const data = await orderService.getOrderShipments(orderNumber);
                setShipments(data || []);
            } catch (error) {
                console.error("Failed to fetch shipments", error);
            } finally {
                setLoading(false);
            }
        };
        fetchShipments();
    }, [orderNumber]);

    if (loading) return <div className="shipment-loading skeleton-row" style={{ height: '200px' }}></div>;
    
    if (!shipments || shipments.length === 0) return null;

    const getStatusStep = (status) => {
        const steps = ['created', 'packed', 'handed_to_carrier', 'in_transit', 'out_for_delivery', 'delivered'];
        const index = steps.indexOf(status);
        return index >= 0 ? index : -1;
    };

    return (
        <div className="order-shipment-card mb-6">
            <h2 className="section-title"><Truck size={20} /> Delivery Tracking</h2>
            
            {shipments.map((shipment, index) => {
                const currentStep = getStatusStep(shipment.status);
                const isErrorState = ['delivery_failed', 'returned_to_sender', 'cancelled'].includes(shipment.status);

                return (
                    <div key={shipment._id} className={`shipment-item ${index > 0 ? 'mt-6 pt-6 border-top' : ''}`}>
                        {shipments.length > 1 && (
                            <h3 className="text-sm font-semibold mb-3 d-flex align-items-center gap-2 text-gray-700">
                                <Package size={16} /> Shipment {index + 1}
                            </h3>
                        )}
                        
                        <div className="shipment-tracking-header mt-0 pt-0 border-0 pb-0">
                            <div className="shipment-carrier-info">
                                <span className="carrier-name">{shipment.carrier}</span>
                                {shipment.trackingNumber && (
                                    <div className="tracking-number-box mt-2">
                                        Tracking: <strong>{shipment.trackingNumber}</strong>
                                        {shipment.trackingUrl && (
                                            <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="tracking-link">
                                                Track Package <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                            {shipment.estimatedDeliveryDate && (
                                <div className="estimated-delivery">
                                    <span className="text-muted">Estimated Delivery</span>
                                    <div className="date">{new Date(shipment.estimatedDeliveryDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                                </div>
                            )}
                        </div>

                        {shipment.items && shipment.items.length > 0 && (
                            <div className="mt-4 bg-gray-50 p-3 rounded text-sm text-gray-700 border">
                                <strong>Items in this shipment:</strong>
                                <ul className="mb-0 mt-2 pl-4">
                                    {shipment.items.map(item => (
                                        <li key={item.productId}>{item.quantity} × {item.productName}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {isErrorState ? (
                            <div className="shipment-error-state mt-4 d-flex align-items-center gap-3">
                                <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
                                <div>
                                    <div className="error-badge mb-1">{shipment.status.replace(/_/g, ' ').toUpperCase()}</div>
                                    <p className="text-sm mb-0">There was an issue with your delivery. Please contact support or check your tracking link for details.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="shipment-stepper mt-6">
                                <div className="stepper-track">
                                    <div className="stepper-progress" style={{ width: `${Math.max(0, currentStep / 5 * 100)}%` }}></div>
                                </div>
                                <div className="stepper-steps">
                                    <div className={`step ${currentStep >= 0 ? 'completed' : ''}`}>
                                        <div className="step-icon"><Package size={16} /></div>
                                        <div className="step-label">Processing</div>
                                    </div>
                                    <div className={`step ${currentStep >= 2 ? 'completed' : ''}`}>
                                        <div className="step-icon"><Truck size={16} /></div>
                                        <div className="step-label">Shipped</div>
                                    </div>
                                    <div className={`step ${currentStep >= 4 ? 'completed' : ''}`}>
                                        <div className="step-icon"><MapPin size={16} /></div>
                                        <div className="step-label">Out for Delivery</div>
                                    </div>
                                    <div className={`step ${currentStep >= 5 ? 'completed' : ''}`}>
                                        <div className="step-icon"><CheckCircle size={16} /></div>
                                        <div className="step-label">Delivered</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {shipment.events && shipment.events.length > 0 && (
                            <div className="shipment-history-toggle mt-4">
                                <details>
                                    <summary className="text-sm font-semibold text-primary cursor-pointer">View Tracking History</summary>
                                    <div className="tracking-history-list mt-3">
                                        {shipment.events.slice().reverse().map((ev, i) => (
                                            <div key={i} className="history-row">
                                                <div className="history-time">{new Date(ev.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                                                <div className="history-status">
                                                    <strong>{ev.status.replace(/_/g, ' ').toUpperCase()}</strong>
                                                    {ev.note && <span className="history-note text-muted d-block">{ev.note}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default OrderShipmentTracking;
