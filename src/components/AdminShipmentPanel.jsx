import { useState, useEffect } from 'react';
import { Truck, ExternalLink, Edit2, Package, Check, AlertCircle } from 'lucide-react';
import { adminService } from '../services/apiService';

const AdminShipmentPanel = ({ order, onStatusChange }) => {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Create new shipment state
    const [isCreating, setIsCreating] = useState(false);
    const [carrier, setCarrier] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingUrl, setTrackingUrl] = useState('');
    const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
    const [selectedItems, setSelectedItems] = useState({});

    // Edit state for existing shipment
    const [editingShipmentId, setEditingShipmentId] = useState(null);
    const [editStatus, setEditStatus] = useState('');
    const [editNote, setEditNote] = useState('');
    const [editCarrier, setEditCarrier] = useState('');
    const [editTrackingNumber, setEditTrackingNumber] = useState('');
    const [editTrackingUrl, setEditTrackingUrl] = useState('');
    const [editEstimatedDeliveryDate, setEditEstimatedDeliveryDate] = useState('');

    const fetchShipments = async () => {
        setLoading(true);
        try {
            const data = await adminService.getShipments(order.orderNumber);
            setShipments(data || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch shipments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShipments();
    }, [order.orderNumber]);

    // Calculate remaining quantities
    const shippedQuantities = {};
    shipments.forEach(s => {
        if (s.status !== 'cancelled') {
            (s.items || []).forEach(item => {
                shippedQuantities[item.productId] = (shippedQuantities[item.productId] || 0) + item.quantity;
            });
        }
    });

    const getRemainingQuantity = (productId, orderedQuantity) => {
        const shipped = shippedQuantities[productId] || 0;
        return Math.max(0, orderedQuantity - shipped);
    };

    const hasRemainingItems = order.items.some(item => getRemainingQuantity(item.productId, item.quantity) > 0);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        // Prepare items
        const itemsToShip = [];
        for (const [productId, quantity] of Object.entries(selectedItems)) {
            if (quantity > 0) {
                itemsToShip.push({ productId: Number(productId), quantity });
            }
        }
        
        if (itemsToShip.length === 0) {
            setError('Please select at least one item to ship.');
            return;
        }

        try {
            const payload = {
                carrier,
                trackingNumber,
                trackingUrl,
                estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate).toISOString() : undefined,
                items: itemsToShip
            };

            await adminService.createShipment(order.orderNumber, payload);
            
            setIsCreating(false);
            setCarrier('');
            setTrackingNumber('');
            setTrackingUrl('');
            setEstimatedDeliveryDate('');
            setSelectedItems({});
            
            await fetchShipments();
            if (onStatusChange) onStatusChange();
        } catch (err) {
            setError(err.message || 'Failed to create shipment');
        }
    };

    const handleEditSubmit = async (e, shipmentId) => {
        e.preventDefault();
        setError(null);
        try {
            const payload = {
                carrier: editCarrier,
                trackingNumber: editTrackingNumber,
                trackingUrl: editTrackingUrl,
                estimatedDeliveryDate: editEstimatedDeliveryDate ? new Date(editEstimatedDeliveryDate).toISOString() : undefined,
                status: editStatus,
                note: editNote
            };

            await adminService.updateShipment(shipmentId, payload);
            setEditingShipmentId(null);
            setEditNote('');
            
            await fetchShipments();
            if (onStatusChange) onStatusChange();
        } catch (err) {
            setError(err.message || 'Failed to update shipment');
        }
    };

    const startEditing = (shipment) => {
        setEditingShipmentId(shipment._id);
        setEditCarrier(shipment.carrier);
        setEditTrackingNumber(shipment.trackingNumber || '');
        setEditTrackingUrl(shipment.trackingUrl || '');
        setEditStatus(shipment.status);
        if (shipment.estimatedDeliveryDate) {
            setEditEstimatedDeliveryDate(new Date(shipment.estimatedDeliveryDate).toISOString().split('T')[0]);
        } else {
            setEditEstimatedDeliveryDate('');
        }
        setEditNote('');
    };

    const getStatusBadgeClass = (status) => {
        const mapping = {
            'created': 'bg-gray-100 text-gray-800',
            'packed': 'bg-blue-100 text-blue-800',
            'handed_to_carrier': 'bg-indigo-100 text-indigo-800',
            'in_transit': 'bg-purple-100 text-purple-800',
            'out_for_delivery': 'bg-orange-100 text-orange-800',
            'delivered': 'bg-green-100 text-green-800',
            'delivery_failed': 'bg-red-100 text-red-800',
            'returned_to_sender': 'bg-yellow-100 text-yellow-800',
            'cancelled': 'bg-red-100 text-red-800',
        };
        return mapping[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="admin-panel mb-6">
                <div className="panel-header"><h2 className="d-flex align-items-center gap-2"><Truck size={20} /> Fulfillment & Shipments</h2></div>
                <div className="panel-body text-center py-4 text-muted">Loading shipments...</div>
            </div>
        );
    }

    return (
        <div className="admin-panel mb-6">
            <div className="panel-header d-flex justify-content-between align-items-center">
                <h2 className="d-flex align-items-center gap-2">
                    <Truck size={20} /> Fulfillment & Shipments
                </h2>
                {hasRemainingItems && !isCreating && (
                    <button className="btn btn-sm btn-primary" onClick={() => setIsCreating(true)}>
                        Create Shipment
                    </button>
                )}
            </div>
            
            <div className="panel-body">
                {error && <div className="text-danger mb-4 text-sm">{error}</div>}
                
                {/* Fulfillment Summary */}
                <div className="mb-4 bg-light p-3 rounded">
                    <h4 className="text-sm font-semibold mb-2">Fulfillment Summary</h4>
                    <table className="w-100 text-sm">
                        <thead>
                            <tr className="text-left text-muted border-bottom">
                                <th className="pb-1">Product</th>
                                <th className="pb-1 text-center">Ordered</th>
                                <th className="pb-1 text-center">Assigned</th>
                                <th className="pb-1 text-center">Remaining</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map(item => {
                                const remaining = getRemainingQuantity(item.productId, item.quantity);
                                const assigned = item.quantity - remaining;
                                return (
                                    <tr key={item.productId} className="border-bottom">
                                        <td className="py-2">{item.productName}</td>
                                        <td className="py-2 text-center font-medium">{item.quantity}</td>
                                        <td className="py-2 text-center text-primary">{assigned}</td>
                                        <td className={`py-2 text-center font-bold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                            {remaining > 0 ? remaining : <Check size={14} className="d-inline" />}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {isCreating && (
                    <form onSubmit={handleCreateSubmit} className="bg-gray-50 border p-4 rounded mb-4">
                        <h4 className="font-semibold text-sm mb-3">New Shipment Details</h4>
                        
                        {order.paymentStatus !== 'paid' && (
                            <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-sm mb-3 border border-yellow-200">
                                <strong>Warning:</strong> Order is not paid. Creating a shipment may fail.
                            </div>
                        )}
                        
                        <div className="mb-4">
                            <label className="text-xs font-semibold mb-1 block">Items to Ship</label>
                            {order.items.map(item => {
                                const remaining = getRemainingQuantity(item.productId, item.quantity);
                                if (remaining === 0) return null;
                                return (
                                    <div key={item.productId} className="d-flex justify-content-between align-items-center mb-2 bg-white p-2 border rounded">
                                        <div className="text-sm flex-1">{item.productName}</div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="text-xs text-muted">Max: {remaining}</span>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max={remaining}
                                                value={selectedItems[item.productId] || 0}
                                                onChange={e => setSelectedItems({...selectedItems, [item.productId]: Number(e.target.value)})}
                                                className="form-control form-control-sm w-20 text-center" 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="mb-3">
                            <label className="text-xs font-semibold mb-1 block">Carrier *</label>
                            <input type="text" className="form-control" value={carrier} onChange={e => setCarrier(e.target.value)} required placeholder="e.g. FedEx, UPS" />
                        </div>
                        
                        <div className="d-flex gap-3 mb-3">
                            <div className="flex-1">
                                <label className="text-xs font-semibold mb-1 block">Tracking Number</label>
                                <input type="text" className="form-control" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-semibold mb-1 block">Est. Delivery</label>
                                <input type="date" className="form-control" value={estimatedDeliveryDate} onChange={e => setEstimatedDeliveryDate(e.target.value)} />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs font-semibold mb-1 block">Tracking URL</label>
                            <input type="url" className="form-control" value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} placeholder="https://..." />
                        </div>

                        <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-primary btn-sm">Create Shipment</button>
                            <button type="button" className="btn btn-outline btn-sm" onClick={() => setIsCreating(false)}>Cancel</button>
                        </div>
                    </form>
                )}

                {/* Existing Shipments */}
                <div className="shipments-list d-flex flex-column gap-4">
                    {shipments.length === 0 ? (
                        <div className="text-center py-4 text-muted text-sm border rounded">No shipments have been created yet.</div>
                    ) : (
                        shipments.map((shipment, index) => (
                            <div key={shipment._id} className="shipment-card border rounded p-3 bg-white">
                                <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-2">
                                    <div>
                                        <h4 className="font-semibold text-sm d-flex align-items-center gap-2">
                                            <Package size={16} /> Shipment {index + 1}
                                        </h4>
                                        <div className="text-xs text-muted mt-1">ID: {shipment._id}</div>
                                    </div>
                                    {editingShipmentId !== shipment._id && (
                                        <button className="btn btn-sm btn-outline py-1 px-2 text-xs" onClick={() => startEditing(shipment)}>
                                            <Edit2 size={12} className="mr-1" /> Edit
                                        </button>
                                    )}
                                </div>
                                
                                {editingShipmentId === shipment._id ? (
                                    <form onSubmit={(e) => handleEditSubmit(e, shipment._id)} className="d-flex flex-column gap-3 mb-3">
                                        <div className="d-flex gap-3">
                                            <div className="flex-1">
                                                <label className="text-xs font-semibold mb-1 block">Carrier</label>
                                                <input type="text" className="form-control form-control-sm" value={editCarrier} onChange={e => setEditCarrier(e.target.value)} required />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs font-semibold mb-1 block">Status</label>
                                                <select className="form-control form-control-sm" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                                                    <option value="created">Created</option>
                                                    <option value="packed">Packed</option>
                                                    <option value="handed_to_carrier">Handed to Carrier</option>
                                                    <option value="in_transit">In Transit</option>
                                                    <option value="out_for_delivery">Out for Delivery</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="delivery_failed">Delivery Failed</option>
                                                    <option value="returned_to_sender">Returned to Sender</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="d-flex gap-3">
                                            <div className="flex-1">
                                                <label className="text-xs font-semibold mb-1 block">Tracking Number</label>
                                                <input type="text" className="form-control form-control-sm" value={editTrackingNumber} onChange={e => setEditTrackingNumber(e.target.value)} />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs font-semibold mb-1 block">Est. Delivery</label>
                                                <input type="date" className="form-control form-control-sm" value={editEstimatedDeliveryDate} onChange={e => setEditEstimatedDeliveryDate(e.target.value)} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold mb-1 block">Tracking URL</label>
                                            <input type="url" className="form-control form-control-sm" value={editTrackingUrl} onChange={e => setEditTrackingUrl(e.target.value)} />
                                        </div>
                                        
                                        <div>
                                            <label className="text-xs font-semibold mb-1 block">Note (Optional)</label>
                                            <input type="text" className="form-control form-control-sm" value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Reason for change..." />
                                        </div>
                                        
                                        <div className="d-flex gap-2">
                                            <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                            <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingShipmentId(null)}>Cancel</button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className="d-flex justify-content-between mb-3">
                                            <div>
                                                <div className="text-xs text-muted">Carrier</div>
                                                <div className="font-medium text-sm">{shipment.carrier}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted mb-1">Status</div>
                                                <span className={`status-badge text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(shipment.status)}`}>
                                                    {shipment.status.replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {shipment.trackingNumber && (
                                            <div className="mb-3 font-mono bg-gray-50 p-2 rounded text-sm border d-flex justify-content-between">
                                                {shipment.trackingNumber}
                                                {shipment.trackingUrl && (
                                                    <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-primary d-flex align-items-center gap-1">
                                                        Track <ExternalLink size={12} />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Shipment Items */}
                                        {shipment.items && shipment.items.length > 0 && (
                                            <div className="mt-3 bg-gray-50 p-2 rounded border">
                                                <div className="text-xs font-semibold text-muted mb-1">Contents:</div>
                                                <ul className="text-sm mb-0 pl-4">
                                                    {shipment.items.map(item => (
                                                        <li key={item.productId} className="mb-1 text-gray-700">
                                                            {item.quantity} × {item.productName}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {/* History Toggle */}
                                        {shipment.events && shipment.events.length > 0 && (
                                            <details className="mt-3">
                                                <summary className="text-xs font-semibold text-primary cursor-pointer outline-none">Show Timeline</summary>
                                                <div className="pl-2 border-left mt-2 ml-1" style={{ borderLeft: '2px solid #e2e8f0' }}>
                                                    {shipment.events.slice().reverse().map((ev, i) => (
                                                        <div key={i} className="mb-2 pl-3 position-relative">
                                                            <div className="position-absolute bg-white border border-primary rounded-circle" style={{ width: '8px', height: '8px', left: '-5px', top: '5px' }}></div>
                                                            <div className="text-xs text-muted">{new Date(ev.createdAt).toLocaleString()}</div>
                                                            <div className="text-sm font-medium capitalize">{ev.status.replace(/_/g, ' ')}</div>
                                                            {ev.note && <div className="text-xs text-gray-500 mt-1">{ev.note}</div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        )}
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminShipmentPanel;
