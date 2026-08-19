import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/apiService';
import { Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import './AdminProductForm.css';

const AdminProductForm = () => {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        category: '',
        brand: '',
        shortDescription: '',
        image: '',
        stockQuantity: '',
        lowStockThreshold: 5,
        isActive: true,
        isBestSeller: false,
        description: ''
    });

    const [loading, setLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isEditMode) {
            const fetchProduct = async () => {
                try {
                    const data = await adminService.getProductById(id);
                    setFormData({
                        name: data.name || '',
                        sku: data.sku || '',
                        price: data.price !== undefined ? data.price : '',
                        category: data.category || '',
                        brand: data.brand || '',
                        shortDescription: data.shortDescription || '',
                        image: data.image || '',
                        stockQuantity: data.stockQuantity !== undefined ? data.stockQuantity : '',
                        lowStockThreshold: data.lowStockThreshold !== undefined ? data.lowStockThreshold : 5,
                        isActive: data.isActive !== undefined ? data.isActive : true,
                        isBestSeller: data.isBestSeller || false,
                        description: data.description || ''
                    });
                } catch (err) {
                    setError(err.message || 'Failed to load product for editing');
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [id, isEditMode]);

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
        setSubmitting(true);

        // Basic front-end validation
        if (!formData.name.trim() || !formData.sku.trim() || !formData.category.trim() || !formData.description.trim()) {
            setError('Please fill in all required text fields.');
            setSubmitting(false);
            return;
        }

        if (Number(formData.price) < 0 || formData.price === '') {
            setError('Price must be a valid non-negative number.');
            setSubmitting(false);
            return;
        }

        if (Number(formData.stockQuantity) < 0 || formData.stockQuantity === '') {
            setError('Stock quantity must be a non-negative number.');
            setSubmitting(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                price: Number(formData.price),
                stockQuantity: Number(formData.stockQuantity),
                lowStockThreshold: Number(formData.lowStockThreshold)
            };

            if (isEditMode) {
                await adminService.updateProduct(id, payload);
            } else {
                await adminService.createProduct(payload);
            }
            
            navigate('/admin/products');
        } catch (err) {
            setError(err.message || 'Failed to save product');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-form-page">
                <div className="skeleton-row mb-4" style={{ height: '40px', width: '200px' }}></div>
                <div className="admin-panel p-4">
                    <div className="skeleton-row mb-4" style={{ height: '400px' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-form-page">
            <header className="page-header">
                <div>
                    <Link to="/admin/products" className="back-link">
                        <ArrowLeft size={16} /> Back to Products
                    </Link>
                    <h1>{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
                </div>
                <button 
                    type="submit" 
                    form="product-form" 
                    className="btn btn-primary d-flex align-items-center gap-2"
                    disabled={submitting}
                >
                    <Save size={18} /> {submitting ? 'Saving...' : 'Save Product'}
                </button>
            </header>

            {error && (
                <div className="admin-alert alert-danger mb-4">
                    <div className="d-flex align-items-center gap-2">
                        <AlertTriangle size={18} /> {error}
                    </div>
                </div>
            )}

            <form id="product-form" onSubmit={handleSubmit} className="admin-form-layout">
                <div className="admin-form-main">
                    <div className="admin-panel mb-6">
                        <div className="panel-header">
                            <h2>Basic Information</h2>
                        </div>
                        <div className="panel-body">
                            <div className="form-group">
                                <label htmlFor="name">Product Name *</label>
                                <input 
                                    type="text" 
                                    id="name" 
                                    name="name" 
                                    className="form-control"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="shortDescription">Short Description</label>
                                <input 
                                    type="text" 
                                    id="shortDescription" 
                                    name="shortDescription" 
                                    className="form-control"
                                    value={formData.shortDescription}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">Full Description *</label>
                                <textarea 
                                    id="description" 
                                    name="description" 
                                    className="form-control"
                                    rows="5"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="admin-panel">
                        <div className="panel-header">
                            <h2>Media</h2>
                        </div>
                        <div className="panel-body">
                            <div className="form-group">
                                <label htmlFor="image">Image URL</label>
                                <input 
                                    type="url" 
                                    id="image" 
                                    name="image" 
                                    className="form-control"
                                    value={formData.image}
                                    onChange={handleChange}
                                    placeholder="https://example.com/image.jpg"
                                />
                                <small className="text-muted mt-1 d-block">Provide a valid image URL for the storefront display.</small>
                            </div>
                            {formData.image && (
                                <div className="img-preview">
                                    <img src={formData.image} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="admin-form-sidebar">
                    <div className="admin-panel mb-6">
                        <div className="panel-header">
                            <h2>Status & Visibility</h2>
                        </div>
                        <div className="panel-body">
                            <div className="form-check mb-3">
                                <input 
                                    type="checkbox" 
                                    id="isActive" 
                                    name="isActive" 
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                />
                                <label htmlFor="isActive">Active (Visible in Store)</label>
                            </div>
                            <div className="form-check">
                                <input 
                                    type="checkbox" 
                                    id="isBestSeller" 
                                    name="isBestSeller" 
                                    checked={formData.isBestSeller}
                                    onChange={handleChange}
                                />
                                <label htmlFor="isBestSeller">Best Seller Badge</label>
                            </div>
                        </div>
                    </div>

                    <div className="admin-panel mb-6">
                        <div className="panel-header">
                            <h2>Organization</h2>
                        </div>
                        <div className="panel-body">
                            <div className="form-group mb-4">
                                <label htmlFor="price">Price (INR) *</label>
                                <div className="input-group">
                                    <span className="input-group-text">₹</span>
                                    <input 
                                        type="number" 
                                        id="price" 
                                        name="price" 
                                        className="form-control pl-8"
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="form-group mb-4">
                                <label htmlFor="category">Category *</label>
                                <input 
                                    type="text" 
                                    id="category" 
                                    name="category" 
                                    className="form-control"
                                    value={formData.category}
                                    onChange={handleChange}
                                    placeholder="e.g., Headphones"
                                    required 
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label htmlFor="brand">Brand</label>
                                <input 
                                    type="text" 
                                    id="brand" 
                                    name="brand" 
                                    className="form-control"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    placeholder="e.g., Sennheiser"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="admin-panel">
                        <div className="panel-header">
                            <h2>Inventory</h2>
                        </div>
                        <div className="panel-body">
                            <div className="form-group mb-4">
                                <label htmlFor="sku">SKU (Stock Keeping Unit) *</label>
                                <input 
                                    type="text" 
                                    id="sku" 
                                    name="sku" 
                                    className="form-control uppercase"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    placeholder="e.g., AUR-HDP-001"
                                    required 
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group half">
                                    <label htmlFor="stockQuantity">Stock Qty *</label>
                                    <input 
                                        type="number" 
                                        id="stockQuantity" 
                                        name="stockQuantity" 
                                        className="form-control"
                                        min="0"
                                        value={formData.stockQuantity}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>
                                <div className="form-group half">
                                    <label htmlFor="lowStockThreshold">Low Threshold *</label>
                                    <input 
                                        type="number" 
                                        id="lowStockThreshold" 
                                        name="lowStockThreshold" 
                                        className="form-control"
                                        min="0"
                                        value={formData.lowStockThreshold}
                                        onChange={handleChange}
                                        required 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AdminProductForm;
