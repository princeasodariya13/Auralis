import { useState, useEffect } from 'react';
import { useAddresses } from '../hooks/useData';
import { addressService } from '../services/apiService';
import { Plus, Edit2, Trash2, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './AddressManager.css';

const AddressForm = ({ initialData, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState(initialData || {
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        isDefault: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (initialData?._id) {
                await addressService.updateAddress(initialData._id, formData);
            } else {
                await addressService.createAddress(formData);
            }
            onSuccess();
        } catch (err) {
            setError(err.message || 'Failed to save address');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="address-form form-container">
            <h3>{initialData ? 'Edit Address' : 'Add New Address'}</h3>
            
            {error && <div className="form-error"><AlertCircle size={16} /> {error}</div>}

            <div className="form-row">
                <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="form-input" />
                </div>
                <div className="form-group">
                    <label>Phone *</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="form-input" />
                </div>
            </div>

            <div className="form-group">
                <label>Address Line 1 *</label>
                <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required className="form-input" />
            </div>

            <div className="form-group">
                <label>Address Line 2 (Optional)</label>
                <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="form-input" />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>City *</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} required className="form-input" />
                </div>
                <div className="form-group">
                    <label>State / Province *</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} required className="form-input" />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Postal Code *</label>
                    <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} required className="form-input" />
                </div>
                <div className="form-group">
                    <label>Country *</label>
                    <input type="text" name="country" value={formData.country} onChange={handleChange} required className="form-input" />
                </div>
            </div>

            <div className="form-group checkbox-group">
                <label className="checkbox-label">
                    <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange} />
                    Set as default shipping address
                </label>
            </div>

            <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Address'}
                </button>
                <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </button>
            </div>
        </form>
    );
};

const AddressManager = ({ onSelectAddress, selectedAddressId, selectionMode = false }) => {
    const { data: addresses, loading, error, refetch } = useAddresses();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const toast = useToast();

    // Auto-select address if in selection mode and none is selected
    useEffect(() => {
        if (selectionMode && addresses && addresses.length > 0 && !selectedAddressId && onSelectAddress) {
            const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
            onSelectAddress(defaultAddr);
        }
    }, [addresses, selectionMode, selectedAddressId, onSelectAddress]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        try {
            await addressService.deleteAddress(id);
            refetch();
        } catch (err) {
            toast.error(err.message || 'Failed to delete address');
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await addressService.setDefaultAddress(id);
            refetch();
        } catch (err) {
            toast.error(err.message || 'Failed to set default address');
        }
    };

    if (loading) return <div className="loading-state">Loading addresses...</div>;
    if (error) return <div className="error-state">{error}</div>;

    if (isAdding) {
        return <AddressForm onSuccess={() => { setIsAdding(false); refetch(); }} onCancel={() => setIsAdding(false)} />;
    }

    if (editingId) {
        const addressToEdit = addresses.find(a => a._id === editingId);
        return <AddressForm initialData={addressToEdit} onSuccess={() => { setEditingId(null); refetch(); }} onCancel={() => setEditingId(null)} />;
    }

    return (
        <div className="address-manager">
            <div className="address-manager-header">
                <h3>{selectionMode ? 'Select Shipping Address' : 'Saved Addresses'}</h3>
                {!selectionMode && (
                    <button className="btn btn-outline btn-sm" onClick={() => setIsAdding(true)}>
                        <Plus size={16} /> Add New
                    </button>
                )}
            </div>

            {addresses.length === 0 ? (
                <div className="empty-addresses">
                    <MapPin size={32} className="empty-icon" />
                    <p>No saved addresses yet.</p>
                    {selectionMode && (
                        <button className="btn btn-primary mt-4" onClick={() => setIsAdding(true)}>
                            Add Shipping Address
                        </button>
                    )}
                </div>
            ) : (
                <div className="address-list">
                    {addresses.map(address => (
                        <div 
                            key={address._id} 
                            className={`address-card ${address.isDefault ? 'default' : ''} ${selectionMode && selectedAddressId === address._id ? 'selected' : ''}`}
                            onClick={() => selectionMode && onSelectAddress && onSelectAddress(address)}
                        >
                            <div className="address-card-header">
                                <h4>{address.fullName}</h4>
                                {address.isDefault && <span className="badge-default">Default</span>}
                            </div>
                            
                            <div className="address-card-body">
                                <p>{address.addressLine1}</p>
                                {address.addressLine2 && <p>{address.addressLine2}</p>}
                                <p>{address.city}, {address.state} {address.postalCode}</p>
                                <p>{address.country}</p>
                                <p className="address-phone">{address.phone}</p>
                            </div>

                            <div className="address-card-actions">
                                {!selectionMode && (
                                    <>
                                        <button onClick={() => setEditingId(address._id)} className="action-btn"><Edit2 size={16} /> Edit</button>
                                        <button onClick={() => handleDelete(address._id)} className="action-btn text-danger"><Trash2 size={16} /> Delete</button>
                                        {!address.isDefault && (
                                            <button onClick={() => handleSetDefault(address._id)} className="action-btn ml-auto">Set as Default</button>
                                        )}
                                    </>
                                )}
                                {selectionMode && selectedAddressId === address._id && (
                                    <span className="selected-indicator"><CheckCircle2 size={20} color="var(--color-primary)" /> Selected</span>
                                )}
                            </div>
                        </div>
                    ))}
                    {selectionMode && (
                        <button className="btn btn-outline w-full mt-4" onClick={() => setIsAdding(true)}>
                            <Plus size={16} /> Add New Address
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AddressManager;
