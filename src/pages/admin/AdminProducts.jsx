import { useState, useEffect } from 'react';
import { adminService, productService } from '../../services/apiService';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit, ArchiveRestore, AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import './AdminProducts.css';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(null);
    
    // Filters
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [status, setStatus] = useState('all');
    const [stockStatus, setStockStatus] = useState('all');
    
    // Deactivation confirmation modal
    const [deactivateProduct, setDeactivateProduct] = useState(null);
    const [deactivating, setDeactivating] = useState(false);

    // Fetch initial data (Categories)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const cats = await productService.getCategories();
                setCategories(cats);
            } catch (err) {
                console.error("Failed to load categories", err);
            }
        };
        fetchCategories();
    }, []);

    // Fetch products based on filters
    const fetchProducts = async (pageToFetch = pagination.page) => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: pageToFetch,
                limit: pagination.limit
            };
            if (search) params.search = search;
            if (category !== 'All') params.category = category;
            if (status !== 'all') params.status = status;
            if (stockStatus !== 'all') params.stockStatus = stockStatus;

            const data = await adminService.getProducts(params);
            setProducts(data.products);
            setPagination(data.pagination);
        } catch (err) {
            setError(err.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchProducts(1);
        }, 500);
        return () => clearTimeout(debounce);
    }, [search, category, status, stockStatus]);

    const handleDeactivate = async () => {
        if (!deactivateProduct) return;
        setDeactivating(true);
        setActionError(null);
        try {
            await adminService.deleteProduct(deactivateProduct.id);
            setActionSuccess(`Product ${deactivateProduct.name} deactivated successfully.`);
            setDeactivateProduct(null);
            fetchProducts();
            
            setTimeout(() => setActionSuccess(null), 3000);
        } catch (err) {
            setActionError(err.message || 'Failed to deactivate product.');
        } finally {
            setDeactivating(false);
        }
    };

    const handleActivate = async (product) => {
        setActionError(null);
        try {
            await adminService.updateProduct(product.id, { isActive: true });
            setActionSuccess(`Product ${product.name} activated successfully.`);
            fetchProducts();
            
            setTimeout(() => setActionSuccess(null), 3000);
        } catch (err) {
            setActionError(err.message || 'Failed to activate product.');
        }
    };

    const clearFilters = () => {
        setSearch('');
        setCategory('All');
        setStatus('all');
        setStockStatus('all');
    };

    return (
        <div className="admin-products-page">
            <header className="page-header">
                <div>
                    <h1>Products</h1>
                    <p className="text-muted">Manage your product catalog, inventory, and visibility.</p>
                </div>
                <Link to="/admin/products/new" className="btn btn-primary d-flex align-items-center gap-2">
                    <Plus size={18} /> Add Product
                </Link>
            </header>

            {(actionError || actionSuccess) && (
                <div className={`admin-alert ${actionError ? 'alert-danger' : 'alert-success'} mb-4`}>
                    {actionError || actionSuccess}
                    <button className="alert-close" onClick={() => { setActionError(null); setActionSuccess(null); }}>
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="admin-panel mb-6">
                <div className="filters-bar">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search name or SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <div className="filter-group">
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="All">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>

                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}>
                            <option value="all">All Stock</option>
                            <option value="in_stock">In Stock</option>
                            <option value="low_stock">Low Stock</option>
                            <option value="out_of_stock">Out of Stock</option>
                        </select>

                        {(search || category !== 'All' || status !== 'all' || stockStatus !== 'all') && (
                            <button className="btn-text text-muted text-sm" onClick={clearFilters}>
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <div className="panel-body p-0">
                    {loading ? (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan="6">
                                                <div className="skeleton-row"></div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : error ? (
                        <div className="admin-empty-state">
                            <AlertTriangle size={32} color="#dc2626" className="mb-2" />
                            <p className="text-danger">{error}</p>
                            <button className="btn btn-outline mt-4" onClick={() => fetchProducts(1)}>Retry</button>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="admin-empty-state">
                            <Package size={48} className="mb-3 text-muted opacity-50" />
                            <h3>No products found</h3>
                            <p className="text-muted">Try adjusting your filters or add a new product.</p>
                            <button className="btn btn-outline mt-4" onClick={clearFilters}>Clear Filters</button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="admin-table products-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(product => {
                                        const isLowStock = product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0;
                                        const isOutOfStock = product.stockQuantity === 0;
                                        
                                        return (
                                            <tr key={product.id} className={!product.isActive ? 'row-inactive' : ''}>
                                                <td>
                                                    <div className="td-product">
                                                        <div className="td-img">
                                                            <img src={product.image} alt={product.name} />
                                                        </div>
                                                        <div className="td-info">
                                                            <span className="td-name">{product.name}</span>
                                                            <span className="td-cat">{product.category}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><span className="td-sku">{product.sku}</span></td>
                                                <td>₹{product.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                                <td>
                                                    <div className={`td-stock ${isOutOfStock ? 'out' : isLowStock ? 'low' : 'in'}`}>
                                                        {product.stockQuantity}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${product.isActive ? 'status-delivered' : 'status-cancelled'}`}>
                                                        {product.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <div className="td-actions">
                                                        <Link to={`/admin/products/${product.id}`} className="btn-icon" title="Edit" aria-label={`Edit ${product.name}`}>
                                                            <Edit size={16} />
                                                        </Link>
                                                        {product.isActive ? (
                                                            <button 
                                                                className="btn-icon text-danger" 
                                                                title="Deactivate/Archive" 
                                                                aria-label={`Deactivate ${product.name}`}
                                                                onClick={() => setDeactivateProduct(product)}
                                                            >
                                                                <ArchiveRestore size={16} />
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                className="btn-icon text-success" 
                                                                title="Activate" 
                                                                aria-label={`Activate ${product.name}`}
                                                                onClick={() => handleActivate(product)}
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                {/* Pagination */}
                {!loading && !error && pagination.totalPages > 1 && (
                    <div className="panel-footer pagination-controls">
                        <span className="pagination-info">
                            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                        </span>
                        <div className="pagination-buttons">
                            <button 
                                className="btn-pagination" 
                                disabled={pagination.page <= 1}
                                onClick={() => fetchProducts(pagination.page - 1)}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="pagination-current">Page {pagination.page} of {pagination.totalPages}</span>
                            <button 
                                className="btn-pagination" 
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchProducts(pagination.page + 1)}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Deactivation Modal */}
            {deactivateProduct && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <div className="modal-header border-danger">
                            <h3>Deactivate Product</h3>
                            <button className="btn-close" onClick={() => setDeactivateProduct(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to deactivate <strong>{deactivateProduct.name}</strong>?</p>
                            <p className="text-muted mt-2 text-sm">
                                It will be hidden from the storefront, but historical orders and reviews will remain intact.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setDeactivateProduct(null)} disabled={deactivating}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDeactivate} disabled={deactivating}>
                                {deactivating ? 'Deactivating...' : 'Deactivate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;
