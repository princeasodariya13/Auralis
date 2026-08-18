import { useState, useEffect, useCallback } from 'react';
import { adminReviewService } from '../../services/apiService';
import { Star, Filter, Search, CheckCircle, XCircle, Flag, ShieldCheck } from 'lucide-react';
import { ErrorState, EmptyState } from '../../components/States';
import './AdminDashboard.css'; // Reuse existing admin styles where possible

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
    
    const [filters, setFilters] = useState({
        status: 'ALL',
        rating: 'ALL',
        sort: 'newest'
    });

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminReviewService.getReviews({
                page: pagination.page,
                limit: pagination.limit,
                status: filters.status,
                rating: filters.rating,
                sort: filters.sort
            });
            setReviews(data.reviews);
            setPagination(data.pagination);
        } catch (err) {
            setError(err.message || 'Failed to fetch reviews');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filters]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    const handleModeration = async (reviewId, newStatus) => {
        try {
            await adminReviewService.updateModeration(reviewId, newStatus);
            // Optimistic update
            setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, moderationStatus: newStatus } : r));
        } catch (error) {
            alert(error.message || 'Failed to moderate review');
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            approved: { class: 'status-success', label: 'Approved' },
            pending: { class: 'status-warning', label: 'Pending' },
            rejected: { class: 'status-error', label: 'Rejected' },
            flagged: { class: 'status-error', label: 'Flagged' }
        };
        const st = config[status] || { class: 'status-default', label: status };
        return <span className={`status-badge ${st.class}`}>{st.label}</span>;
    };

    if (error) return <ErrorState message={error} onRetry={fetchReviews} />;

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Review Moderation</h1>
                    <p className="admin-page-subtitle">Manage customer product reviews</p>
                </div>
            </div>

            <div className="admin-filters-bar mb-6" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="filter-group">
                    <Filter size={18} />
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="admin-select">
                        <option value="ALL">All Statuses</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="flagged">Flagged</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                <div className="filter-group">
                    <Star size={18} />
                    <select name="rating" value={filters.rating} onChange={handleFilterChange} className="admin-select">
                        <option value="ALL">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>
                </div>
                <div className="filter-group">
                    <select name="sort" value={filters.sort} onChange={handleFilterChange} className="admin-select">
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : reviews.length === 0 ? (
                <EmptyState message="No reviews found matching the filters." />
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Review</th>
                                <th>Customer</th>
                                <th>Status</th>
                                <th>Reports</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map(review => (
                                <tr key={review._id}>
                                    <td>
                                        <div className="font-semibold text-sm">ID: {review.productId}</div>
                                    </td>
                                    <td style={{ maxWidth: '300px' }}>
                                        <div className="flex items-center gap-1 mb-1">
                                            {[1,2,3,4,5].map(star => (
                                                <Star 
                                                    key={star} 
                                                    size={12} 
                                                    fill={star <= review.rating ? "#C9A24D" : "none"} 
                                                    color={star <= review.rating ? "#C9A24D" : "var(--color-gray-400)"} 
                                                />
                                            ))}
                                            <span className="text-xs text-muted ml-2">{new Date(review.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {review.title && <div className="font-semibold text-sm mb-1">{review.title}</div>}
                                        <div className="text-sm truncate text-muted">{review.comment}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm">{review.userId.name}</div>
                                        {review.verifiedPurchase && (
                                            <div className="flex items-center gap-1 text-xs text-success mt-1">
                                                <ShieldCheck size={12} /> Verified
                                            </div>
                                        )}
                                    </td>
                                    <td>{getStatusBadge(review.moderationStatus)}</td>
                                    <td>
                                        {review.reportCount > 0 ? (
                                            <div className="flex items-center gap-1 text-danger font-semibold">
                                                <Flag size={14} /> {review.reportCount}
                                            </div>
                                        ) : (
                                            <span className="text-muted text-sm">None</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            {review.moderationStatus !== 'approved' && (
                                                <button 
                                                    className="btn btn-sm btn-outline text-success"
                                                    onClick={() => handleModeration(review._id, 'approved')}
                                                    title="Approve"
                                                >
                                                    <CheckCircle size={14} />
                                                </button>
                                            )}
                                            {review.moderationStatus !== 'flagged' && (
                                                <button 
                                                    className="btn btn-sm btn-outline text-warning"
                                                    onClick={() => handleModeration(review._id, 'flagged')}
                                                    title="Flag"
                                                >
                                                    <Flag size={14} />
                                                </button>
                                            )}
                                            {review.moderationStatus !== 'rejected' && (
                                                <button 
                                                    className="btn btn-sm btn-outline text-danger"
                                                    onClick={() => handleModeration(review._id, 'rejected')}
                                                    title="Reject"
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {pagination.pages > 1 && (
                <div className="pagination flex justify-between items-center mt-6">
                    <button 
                        className="btn btn-outline"
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                        Previous
                    </button>
                    <span>Page {pagination.page} of {pagination.pages}</span>
                    <button 
                        className="btn btn-outline"
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminReviews;
