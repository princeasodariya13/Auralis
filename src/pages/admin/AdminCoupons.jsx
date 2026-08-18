import { useState, useEffect } from 'react';
import { adminService } from '../../services/apiService';
import { Plus, Edit2, Trash2, Tag, Calendar, Users, AlertTriangle } from 'lucide-react';
import './AdminCoupons.css';

const AdminCoupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentCoupon, setCurrentCoupon] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minimumOrderValue: '',
        maximumDiscount: '',
        startsAt: '',
        expiresAt: '',
        usageLimit: '',
        perUserLimit: '1',
        isActive: true
    });

    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const data = await adminService.getCoupons();
            setCoupons(data);
            setError(null);
        } catch (err) {
            setError(err.error?.message || 'Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (coupon = null) => {
        if (coupon) {
            setCurrentCoupon(coupon);
            setFormData({
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                minimumOrderValue: coupon.minimumOrderValue || '',
                maximumDiscount: coupon.maximumDiscount || '',
                startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : '',
                expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : '',
                usageLimit: coupon.usageLimit || '',
                perUserLimit: coupon.perUserLimit || '1',
                isActive: coupon.isActive
            });
        } else {
            setCurrentCoupon(null);
            setFormData({
                code: '',
                description: '',
                discountType: 'percentage',
                discountValue: '',
                minimumOrderValue: '',
                maximumDiscount: '',
                startsAt: '',
                expiresAt: '',
                usageLimit: '',
                perUserLimit: '1',
                isActive: true
            });
        }
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        try {
            const payload = { ...formData };
            // Clean up empty strings
            if (payload.minimumOrderValue === '') delete payload.minimumOrderValue;
            if (payload.maximumDiscount === '') delete payload.maximumDiscount;
            if (payload.usageLimit === '') delete payload.usageLimit;
            if (payload.startsAt === '') delete payload.startsAt;
            if (payload.expiresAt === '') delete payload.expiresAt;

            if (currentCoupon) {
                await adminService.updateCoupon(currentCoupon._id, payload);
            } else {
                await adminService.createCoupon(payload);
            }
            setShowModal(false);
            fetchCoupons();
        } catch (err) {
            setFormError(err.error?.message || 'Failed to save coupon');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            try {
                await adminService.deleteCoupon(id);
                fetchCoupons();
            } catch (err) {
                alert(err.error?.message || 'Failed to delete coupon');
            }
        }
    };

    if (loading) {
        return <div className="admin-loading">Loading coupons...</div>;
    }

    return (
        <div className="admin-coupons">
            <div className="admin-header">
                <div>
                    <h1>Coupons & Promotions</h1>
                    <p className="text-muted">Manage discount codes and promotional pricing.</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Add Coupon
                </button>
            </div>

            {error && <div className="admin-alert error">{error}</div>}

            <div className="admin-panel">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Type / Value</th>
                                <th>Usage</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.length > 0 ? coupons.map(coupon => (
                                <tr key={coupon._id}>
                                    <td>
                                        <div className="coupon-code-badge">{coupon.code}</div>
                                        <div className="coupon-desc">{coupon.description}</div>
                                    </td>
                                    <td>
                                        <div className="coupon-value">
                                            {coupon.discountType === 'percentage' 
                                                ? `${coupon.discountValue}% OFF` 
                                                : `$${coupon.discountValue} OFF`}
                                        </div>
                                        {coupon.minimumOrderValue > 0 && (
                                            <div className="text-muted small">Min: ${coupon.minimumOrderValue}</div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="usage-stats">
                                            {coupon.usedCount} / {coupon.usageLimit ? coupon.usageLimit : '∞'}
                                        </div>
                                        <div className="text-muted small">Limit per user: {coupon.perUserLimit}</div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${coupon.isActive ? 'status-active' : 'status-inactive'}`}>
                                            {coupon.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-icon" onClick={() => handleOpenModal(coupon)} title="Edit">
                                                <Edit2 size={18} />
                                            </button>
                                            <button className="btn-icon delete" onClick={() => handleDelete(coupon._id)} title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-8">
                                        <Tag size={48} className="text-muted mx-auto mb-4" />
                                        <p>No coupons found. Create one to get started.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Coupon Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content admin-coupon-modal">
                        <div className="modal-header">
                            <h2>{currentCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
                            <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            {formError && <div className="admin-alert error mb-4"><AlertTriangle size={16}/> {formError}</div>}
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Coupon Code *</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={formData.code} 
                                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                        required 
                                        disabled={!!currentCoupon} // Cannot edit code after creation
                                        placeholder="e.g. SAVE20"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description *</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={formData.description} 
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        required 
                                        placeholder="Summer Sale 20% Off"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Discount Type *</label>
                                    <select 
                                        className="form-control" 
                                        value={formData.discountType} 
                                        onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount ($)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Discount Value *</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        value={formData.discountValue} 
                                        onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                                        required 
                                        min="0"
                                        step="any"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Minimum Order Value ($)</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        value={formData.minimumOrderValue} 
                                        onChange={(e) => setFormData({...formData, minimumOrderValue: e.target.value})}
                                        min="0"
                                        step="any"
                                        placeholder="Optional"
                                    />
                                </div>
                                {formData.discountType === 'percentage' && (
                                    <div className="form-group">
                                        <label>Maximum Discount ($)</label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            value={formData.maximumDiscount} 
                                            onChange={(e) => setFormData({...formData, maximumDiscount: e.target.value})}
                                            min="0"
                                            step="any"
                                            placeholder="Optional"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Starts At</label>
                                    <input 
                                        type="datetime-local" 
                                        className="form-control" 
                                        value={formData.startsAt} 
                                        onChange={(e) => setFormData({...formData, startsAt: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Expires At</label>
                                    <input 
                                        type="datetime-local" 
                                        className="form-control" 
                                        value={formData.expiresAt} 
                                        onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Total Usage Limit</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        value={formData.usageLimit} 
                                        onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                                        min="1"
                                        placeholder="Unlimited"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Per-User Limit</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        value={formData.perUserLimit} 
                                        onChange={(e) => setFormData({...formData, perUserLimit: e.target.value})}
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group mt-2">
                                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <strong>Coupon is Active</strong>
                                </label>
                            </div>

                            <div className="modal-footer mt-6">
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{currentCoupon ? 'Save Changes' : 'Create Coupon'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCoupons;
