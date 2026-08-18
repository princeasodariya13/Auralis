import { useState, useEffect } from 'react';
import { adminService, productService } from '../../services/apiService';
import { Search, AlertTriangle, ChevronLeft, ChevronRight, X, PackageOpen, History, Info } from 'lucide-react';
import './AdminInventory.css';

const AdminInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [summary, setSummary] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filters
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [status, setStatus] = useState('active'); // Default to active for inventory
    const [stockStatus, setStockStatus] = useState('all');
    
    // Modals
    const [adjustModalProduct, setAdjustModalProduct] = useState(null);
    const [historyModalProduct, setHistoryModalProduct] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [historyLoading, setHistoryLoading] = useState(false);
    
    // Adjust Form State
    const [adjustForm, setAdjustForm] = useState({
        adjustmentType: 'stock_in',
        quantity: '',
        reason: 'New stock received',
        note: ''
    });
    const [adjusting, setAdjusting] = useState(false);
    const [adjustError, setAdjustError] = useState(null);
    const [adjustSuccess, setAdjustSuccess] = useState(null);

    // Initial Fetch
    useEffect(() => {
        const init = async () => {
            try {
                const cats = await productService.getCategories();
                setCategories(cats);
                
                const sum = await adminService.getInventorySummary();
                setSummary(sum);
                setSummaryLoading(false);
            } catch (err) {
                console.error("Failed to load init data", err);
            }
        };
        init();
    }, []);

    // Fetch Inventory
    const fetchInventory = async (pageToFetch = pagination.page) => {
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

            const data = await adminService.getInventory(params);
            setInventory(data.inventory);
            setPagination(data.pagination);
        } catch (err) {
            setError(err.message || 'Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchInventory(1);
        }, 500);
        return () => clearTimeout(debounce);
    }, [search, category, status, stockStatus]);

    // Handle history modal
    const openHistory = async (product, page = 1) => {
        if (!product && !historyModalProduct) return;
        const currentProd = product || historyModalProduct;
        
        if (product) setHistoryModalProduct(product);
        setHistoryLoading(true);
        try {
            const data = await adminService.getInventoryHistory(currentProd.id, page);
            setHistoryData(data.history);
            setHistoryPagination(data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Handle adjust form
    const handleAdjustChange = (e) => {
        setAdjustForm({ ...adjustForm, [e.target.name]: e.target.value });
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        setAdjusting(true);
        setAdjustError(null);
        try {
            const res = await adminService.adjustInventory(adjustModalProduct.id, adjustForm);
            setAdjustSuccess(`Stock adjusted: ${res.previousQuantity} → ${res.newQuantity}`);
            
            // Refresh
            fetchInventory();
            const sum = await adminService.getInventorySummary();
            setSummary(sum);

            setTimeout(() => {
                setAdjustModalProduct(null);
                setAdjustSuccess(null);
                setAdjustForm({ adjustmentType: 'stock_in', quantity: '', reason: 'New stock received', note: '' });
            }, 2000);
        } catch (err) {
            setAdjustError(err.message || 'Adjustment failed');
        } finally {
            setAdjusting(false);
        }
    };

    const clearFilters = () => {
        setSearch('');
        setCategory('All');
        setStatus('active');
        setStockStatus('all');
    };

    const renderStockStatus = (product) => {
        if (!product.isActive) return <span className="status-badge status-cancelled">INACTIVE</span>;
        if (product.stockQuantity === 0) return <span className="status-badge status-cancelled">OUT OF STOCK</span>;
        if (product.stockQuantity <= product.lowStockThreshold) return <span className="status-badge status-pending_payment">LOW STOCK</span>;
        return <span className="status-badge status-delivered">IN STOCK</span>;
    };

    return (
        <div className="admin-inventory-page">
            <header className="page-header">
                <div>
                    <h1>Inventory Management</h1>
                    <p className="text-muted">Monitor and adjust product stock levels.</p>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="admin-metrics-grid mb-6">
                <div className="admin-metric-card">
                    <div className="metric-header">
                        <h3 className="metric-title">Total Units</h3>
                        <PackageOpen className="metric-icon" size={20} />
                    </div>
                    <div className="metric-value">
                        {summaryLoading ? '...' : summary?.totalUnits.toLocaleString()}
                    </div>
                    <div className="metric-subtext text-muted">Across active products</div>
                </div>
                <div className="admin-metric-card">
                    <div className="metric-header">
                        <h3 className="metric-title">Low Stock</h3>
                        <AlertTriangle className="metric-icon text-warning" size={20} />
                    </div>
                    <div className="metric-value">
                        {summaryLoading ? '...' : summary?.lowStock}
                    </div>
                    <div className="metric-subtext text-muted">Items below threshold</div>
                </div>
                <div className="admin-metric-card">
                    <div className="metric-header">
                        <h3 className="metric-title">Out of Stock</h3>
                        <AlertTriangle className="metric-icon text-danger" size={20} />
                    </div>
                    <div className="metric-value">
                        {summaryLoading ? '...' : summary?.outOfStock}
                    </div>
                    <div className="metric-subtext text-muted">Items unavailable</div>
                </div>
                <div className="admin-metric-card">
                    <div className="metric-header">
                        <h3 className="metric-title">Active Catalog</h3>
                        <Info className="metric-icon" size={20} />
                    </div>
                    <div className="metric-value">
                        {summaryLoading ? '...' : summary?.activeProducts}
                    </div>
                    <div className="metric-subtext text-muted">{summary?.inactiveProducts} inactive</div>
                </div>
            </div>

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
                            <option value="all">All Stock Status</option>
                            <option value="in_stock">In Stock</option>
                            <option value="low_stock">Low Stock</option>
                            <option value="out_of_stock">Out of Stock</option>
                        </select>

                        {(search || category !== 'All' || status !== 'active' || stockStatus !== 'all') && (
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
                                        <th>Product / SKU</th>
                                        <th>Current Stock</th>
                                        <th>Status</th>
                                        <th>Last Update</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan="5"><div className="skeleton-row"></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : error ? (
                        <div className="admin-empty-state">
                            <AlertTriangle size={32} color="#dc2626" className="mb-2" />
                            <p className="text-danger">{error}</p>
                            <button className="btn btn-outline mt-4" onClick={() => fetchInventory(1)}>Retry</button>
                        </div>
                    ) : inventory.length === 0 ? (
                        <div className="admin-empty-state">
                            <PackageOpen size={48} className="mb-3 text-muted opacity-50" />
                            <h3>No inventory found</h3>
                            <p className="text-muted">Try adjusting your filters.</p>
                            <button className="btn btn-outline mt-4" onClick={clearFilters}>Clear Filters</button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="admin-table inventory-table">
                                <thead>
                                    <tr>
                                        <th>Product / SKU</th>
                                        <th>Current Stock</th>
                                        <th>Status</th>
                                        <th>Last Update</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map(product => (
                                        <tr key={product.id} className={!product.isActive ? 'row-inactive' : ''}>
                                            <td>
                                                <div className="td-product">
                                                    <div className="td-img">
                                                        <img src={product.image} alt={product.name} />
                                                    </div>
                                                    <div className="td-info">
                                                        <span className="td-name">{product.name}</span>
                                                        <span className="td-sku">{product.sku}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="stock-info">
                                                    <span className="stock-qty">{product.stockQuantity}</span>
                                                    <span className="stock-threshold text-muted text-sm">/ {product.lowStockThreshold} threshold</span>
                                                </div>
                                            </td>
                                            <td>{renderStockStatus(product)}</td>
                                            <td>
                                                <div className="text-sm">
                                                    {product.lastStockUpdate ? new Date(product.lastStockUpdate).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="td-actions">
                                                    <button 
                                                        className="btn btn-sm btn-outline" 
                                                        onClick={() => {
                                                            setAdjustModalProduct(product);
                                                            setAdjustForm({
                                                                adjustmentType: 'stock_in',
                                                                quantity: '',
                                                                reason: 'New stock received',
                                                                note: ''
                                                            });
                                                            setAdjustError(null);
                                                            setAdjustSuccess(null);
                                                        }}
                                                    >
                                                        Adjust
                                                    </button>
                                                    <button 
                                                        className="btn-icon" 
                                                        title="History"
                                                        onClick={() => openHistory(product)}
                                                    >
                                                        <History size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
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
                                onClick={() => fetchInventory(pagination.page - 1)}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="pagination-current">Page {pagination.page} of {pagination.totalPages}</span>
                            <button 
                                className="btn-pagination" 
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchInventory(pagination.page + 1)}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Adjust Modal */}
            {adjustModalProduct && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <div className="modal-header">
                            <h3>Adjust Inventory</h3>
                            <button className="btn-close" onClick={() => !adjusting && setAdjustModalProduct(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            {adjustSuccess ? (
                                <div className="admin-alert alert-success">
                                    {adjustSuccess}
                                </div>
                            ) : (
                                <form id="adjust-form" onSubmit={handleAdjustSubmit}>
                                    <div className="adjust-product-info mb-4">
                                        <strong>{adjustModalProduct.name}</strong>
                                        <span className="text-muted ml-2">({adjustModalProduct.sku})</span>
                                        <div className="mt-1">Current Stock: <strong>{adjustModalProduct.stockQuantity}</strong></div>
                                    </div>
                                    
                                    {adjustError && <div className="admin-alert alert-danger mb-3 py-2">{adjustError}</div>}

                                    <div className="form-group mb-3">
                                        <label>Adjustment Type</label>
                                        <select 
                                            name="adjustmentType" 
                                            className="form-control"
                                            value={adjustForm.adjustmentType}
                                            onChange={handleAdjustChange}
                                        >
                                            <option value="stock_in">Stock In (Add)</option>
                                            <option value="stock_out">Stock Out (Remove)</option>
                                            <option value="correction">Correction (Set Exact)</option>
                                        </select>
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Quantity {adjustForm.adjustmentType === 'correction' ? '(New Total)' : ''}</label>
                                        <input 
                                            type="number" 
                                            name="quantity"
                                            className="form-control"
                                            min="0"
                                            max="100000"
                                            value={adjustForm.quantity}
                                            onChange={handleAdjustChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Reason</label>
                                        <select 
                                            name="reason" 
                                            className="form-control"
                                            value={adjustForm.reason}
                                            onChange={handleAdjustChange}
                                            required
                                        >
                                            {adjustForm.adjustmentType === 'stock_in' && (
                                                <>
                                                    <option value="New stock received">New stock received</option>
                                                    <option value="Returned item">Returned item</option>
                                                </>
                                            )}
                                            {adjustForm.adjustmentType === 'stock_out' && (
                                                <>
                                                    <option value="Damaged item">Damaged item</option>
                                                    <option value="Lost in transit">Lost in transit</option>
                                                    <option value="Promotional giveaway">Promotional giveaway</option>
                                                </>
                                            )}
                                            <option value="Manual adjustment">Manual adjustment</option>
                                            <option value="Stock correction">Stock correction</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Note (Optional)</label>
                                        <input 
                                            type="text" 
                                            name="note"
                                            className="form-control"
                                            value={adjustForm.note}
                                            onChange={handleAdjustChange}
                                            maxLength="150"
                                        />
                                    </div>

                                    <div className="adjust-preview mt-4 p-3 bg-light rounded text-center">
                                        <div className="text-sm text-muted mb-1">Preview</div>
                                        <div className="preview-calc" style={{ fontSize: '1.1rem' }}>
                                            {adjustModalProduct.stockQuantity} → <strong>
                                                {adjustForm.quantity === '' ? '?' : 
                                                 adjustForm.adjustmentType === 'stock_in' ? adjustModalProduct.stockQuantity + Number(adjustForm.quantity) :
                                                 adjustForm.adjustmentType === 'stock_out' ? Math.max(0, adjustModalProduct.stockQuantity - Number(adjustForm.quantity)) :
                                                 Number(adjustForm.quantity)}
                                            </strong>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setAdjustModalProduct(null)} disabled={adjusting || adjustSuccess}>Cancel</button>
                            <button className="btn btn-primary" type="submit" form="adjust-form" disabled={adjusting || adjustSuccess}>
                                {adjusting ? 'Applying...' : 'Apply Adjustment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {historyModalProduct && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '800px' }}>
                        <div className="modal-header">
                            <h3>Inventory History: {historyModalProduct.name}</h3>
                            <button className="btn-close" onClick={() => setHistoryModalProduct(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body p-0">
                            {historyLoading ? (
                                <div className="p-4 text-center text-muted">Loading history...</div>
                            ) : historyData.length === 0 ? (
                                <div className="p-5 text-center text-muted">No inventory history found for this product.</div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="admin-table text-sm">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Admin</th>
                                                <th>Type</th>
                                                <th>Change</th>
                                                <th>Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historyData.map(log => (
                                                <tr key={log._id}>
                                                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                                                    <td>{log.adminId?.name || 'System'}</td>
                                                    <td>
                                                        <span className="capitalize">{log.adjustmentType.replace('_', ' ')}</span>
                                                    </td>
                                                    <td>
                                                        {log.previousQuantity} → <strong>{log.newQuantity}</strong>
                                                        <span className={`ml-2 ${log.changeQuantity > 0 ? 'text-success' : log.changeQuantity < 0 ? 'text-danger' : 'text-muted'}`}>
                                                            ({log.changeQuantity > 0 ? '+' : ''}{log.changeQuantity})
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div>{log.reason}</div>
                                                        {log.note && <div className="text-muted text-xs">{log.note}</div>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        {historyPagination.totalPages > 1 && (
                            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                                <span className="text-sm text-muted">Page {historyPagination.page} of {historyPagination.totalPages}</span>
                                <div className="pagination-buttons">
                                    <button 
                                        className="btn-pagination" 
                                        disabled={historyPagination.page <= 1}
                                        onClick={() => openHistory(null, historyPagination.page - 1)}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button 
                                        className="btn-pagination" 
                                        disabled={historyPagination.page >= historyPagination.totalPages}
                                        onClick={() => openHistory(null, historyPagination.page + 1)}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInventory;
