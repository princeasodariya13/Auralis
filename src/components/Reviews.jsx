import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reviewService } from '../services/apiService';
import { Star, Edit2, Trash2, ShieldCheck, ThumbsUp, Flag, MessageSquare } from 'lucide-react';
import { EmptyState } from './States';
import './Reviews.css';

const ReviewForm = ({ productId, initialData, onSuccess, onCancel }) => {
    const [rating, setRating] = useState(initialData?.rating || 5);
    const [comment, setComment] = useState(initialData?.comment || '');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (comment.trim().length < 2) {
            setError("Comment must be at least 2 characters.");
            return;
        }

        setLoading(true);
        try {
            if (initialData) {
                await reviewService.updateReview(productId, initialData._id, { rating, comment });
            } else {
                await reviewService.createReview(productId, { rating, comment });
            }
            onSuccess();
            if (!initialData) {
                setRating(5);
                setComment('');
            }
        } catch (err) {
            setError(err.response?.data?.error?.message || err.message || "Failed to submit review");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="review-form form-container">
            <h3>{initialData ? 'Edit Your Review' : 'Write a Review'}</h3>
            
            {error && <div className="form-error">{error}</div>}
            
            <div className="form-group">
                <label>Rating</label>
                <div className="star-rating-input">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="star-btn"
                            aria-label={`Rate ${star} stars`}
                        >
                            <Star 
                                size={24} 
                                fill={star <= rating ? "#C9A24D" : "none"} 
                                color={star <= rating ? "#C9A24D" : "var(--color-gray-400)"} 
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="comment">Comment</label>
                <textarea
                    id="comment"
                    className="form-input"
                    rows="4"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                />
            </div>

            <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Submitting...' : (initialData ? 'Update Review' : 'Submit Review')}
                </button>
                {initialData && onCancel && (
                    <button type="button" className="btn btn-outline" onClick={onCancel}>
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

const Reviews = ({ productId, reviewsData, onReviewChanged }) => {
    const { user, isAuthenticated } = useAuth();
    const [editingReviewId, setEditingReviewId] = useState(null);

    const handleDelete = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete your review?")) return;
        try {
            await reviewService.deleteReview(productId, reviewId);
            onReviewChanged();
        } catch (error) {
            alert(error.message || "Failed to delete review");
        }
    };

    const handleVote = async (reviewId, value) => {
        if (!isAuthenticated) {
            alert('Please sign in to vote.');
            return;
        }
        try {
            await reviewService.voteReview(reviewId, value);
            onReviewChanged();
        } catch (error) {
            alert(error.message || "Failed to vote.");
        }
    };

    const handleReport = async (reviewId) => {
        if (!isAuthenticated) {
            alert('Please sign in to report.');
            return;
        }
        const reason = window.prompt("Why are you reporting this review? (inappropriate, spam, misleading, offensive, suspicious, other)");
        if (!reason) return;
        
        try {
            await reviewService.reportReview(reviewId, reason.toLowerCase());
            alert('Review reported successfully.');
        } catch (error) {
            alert(error.message || "Failed to report review.");
        }
    };

    if (!reviewsData) return null;

    const { reviews, stats } = reviewsData;
    const userReview = user ? reviews.find(r => r.userId._id === user._id) : null;

    return (
        <div className="reviews-section">
            <div className="reviews-header">
                <h2>Customer Reviews</h2>
                
                {stats && stats.count > 0 ? (
                    <div className="reviews-summary">
                        <div className="average-rating">
                            <span className="rating-number">{stats.average}</span>
                            <div className="stars">
                                {[1,2,3,4,5].map(star => (
                                    <Star 
                                        key={star} 
                                        size={20} 
                                        fill={star <= Math.round(stats.average) ? "#C9A24D" : "none"} 
                                        color={star <= Math.round(stats.average) ? "#C9A24D" : "var(--color-gray-400)"} 
                                    />
                                ))}
                            </div>
                            <span className="rating-count">Based on {stats.count} reviews</span>
                        </div>
                    </div>
                ) : (
                    <EmptyState 
                        icon={MessageSquare}
                        title="No reviews yet"
                        message="Be the first to share your experience with this product."
                    />
                )}
            </div>

            <div className="reviews-content">
                {/* Form Logic */}
                {isAuthenticated ? (
                    userReview ? (
                        editingReviewId === userReview._id ? (
                            <ReviewForm 
                                productId={productId} 
                                initialData={userReview} 
                                onSuccess={() => {
                                    setEditingReviewId(null);
                                    onReviewChanged();
                                }}
                                onCancel={() => setEditingReviewId(null)}
                            />
                        ) : (
                            <div className="user-review-notice">
                                <p>You have already reviewed this product.</p>
                                <button className="btn btn-outline btn-sm" onClick={() => setEditingReviewId(userReview._id)}>
                                    Edit Review
                                </button>
                            </div>
                        )
                    ) : (
                        <div className="review-creation-section">
                            <p className="purchase-notice">
                                <ShieldCheck size={18} color="#16a34a" /> 
                                Only verified purchasers can review this product.
                            </p>
                            <ReviewForm 
                                productId={productId} 
                                onSuccess={onReviewChanged} 
                            />
                        </div>
                    )
                ) : (
                    <div className="login-prompt">
                        <p>Sign in to share your experience.</p>
                        <a href="/login" className="btn btn-outline">Sign In</a>
                    </div>
                )}

                {/* Review List */}
                <div className="review-list">
                    {reviews.map(review => (
                        <div key={review._id} className="review-item">
                            <div className="review-meta">
                                <div className="stars">
                                    {[1,2,3,4,5].map(star => (
                                        <Star 
                                            key={star} 
                                            size={14} 
                                            fill={star <= review.rating ? "#C9A24D" : "none"} 
                                            color={star <= review.rating ? "#C9A24D" : "var(--color-gray-400)"} 
                                        />
                                    ))}
                                </div>
                                <span className="review-author">{review.userId.name}</span>
                                {review.verifiedPurchase && (
                                    <span className="verified-badge" title="Verified Purchase">
                                        <ShieldCheck size={14} /> Verified
                                    </span>
                                )}
                                <span className="review-date">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                    {review.isEdited && ' (Edited)'}
                                </span>
                                
                                {user && user._id === review.userId._id && editingReviewId !== review._id && (
                                    <div className="review-actions">
                                        <button onClick={() => setEditingReviewId(review._id)} title="Edit"><Edit2 size={14}/></button>
                                        <button onClick={() => handleDelete(review._id)} title="Delete"><Trash2 size={14}/></button>
                                    </div>
                                )}
                            </div>
                            <p className="review-comment">{review.comment}</p>
                            
                            <div className="review-footer">
                                <button 
                                    className={`vote-btn ${review.userVote === 1 ? 'active' : ''}`}
                                    onClick={() => handleVote(review._id, 1)}
                                    title="Helpful"
                                >
                                    <ThumbsUp size={14} /> 
                                    <span>{review.helpfulCount || 0}</span>
                                </button>
                                <button 
                                    className="report-btn" 
                                    onClick={() => handleReport(review._id)}
                                    title="Report"
                                >
                                    <Flag size={14} /> Report
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Reviews;
