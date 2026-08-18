import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import ReviewVote from '../models/ReviewVote.js';
import ReviewReport from '../models/ReviewReport.js';

// @desc    Get reviews for a product
// @route   GET /api/v1/products/:productId/reviews
// @access  Public
export const getReviews = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        
        // 1. Pagination
        const pageNum = Math.max(1, parseInt(req.query.page) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        // 2. Query
        const query = { productId, moderationStatus: 'approved' };
        const total = await Review.countDocuments(query);
        const reviews = await Review.find(query)
            .populate('userId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(); // Use lean for modifying objects

        // Fetch helpfulness votes and user's vote for the paginated reviews
        const reviewIds = reviews.map(r => r._id);
        
        const votes = await ReviewVote.aggregate([
            { $match: { reviewId: { $in: reviewIds } } },
            { $group: { _id: '$reviewId', helpfulCount: { $sum: { $cond: [{ $eq: ['$value', 1] }, 1, 0] } } } }
        ]);
        
        let userVotes = [];
        if (req.user) {
            userVotes = await ReviewVote.find({ reviewId: { $in: reviewIds }, userId: req.user._id }).lean();
        }

        const formattedReviews = reviews.map(r => {
            const voteStat = votes.find(v => v._id.toString() === r._id.toString());
            const userVote = userVotes.find(v => v.reviewId.toString() === r._id.toString());
            return {
                ...r,
                helpfulCount: voteStat ? voteStat.helpfulCount : 0,
                userVote: userVote ? userVote.value : 0
            };
        });

        // Calculate distribution and average lazily using only approved reviews
        const allReviews = await Review.find(query).select('rating');
        const ratingCount = allReviews.length;
        const averageRating = ratingCount > 0 
            ? (allReviews.reduce((sum, rev) => sum + rev.rating, 0) / ratingCount).toFixed(1) 
            : 0;
            
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        allReviews.forEach(r => { distribution[r.rating]++; });

        res.json({
            success: true,
            data: {
                reviews: formattedReviews,
                stats: {
                    average: Number(averageRating),
                    count: ratingCount,
                    distribution
                },
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error(`Error in getReviews: ${error.message}`);
        res.status(500).json({
            success: false,
            error: { message: 'Server error retrieving reviews' }
        });
    }
};

// @desc    Create a review
// @route   POST /api/v1/products/:productId/reviews
// @access  Private
export const createReview = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const { rating, title, comment } = req.body;

        // Validation
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: { message: 'Valid rating between 1 and 5 is required' }});
        }
        if (!comment || comment.trim().length < 2) {
            return res.status(400).json({ success: false, error: { message: 'Comment is required and must be at least 2 characters' }});
        }
        if (comment.length > 1000) {
            return res.status(400).json({ success: false, error: { message: 'Comment is too long' }});
        }

        // Verify product exists
        const product = await Product.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({ success: false, error: { message: 'Product not found' }});
        }

        // Verify purchase
        const hasPurchased = await Order.exists({
            userId: req.user._id,
            paymentStatus: 'paid',
            'items.productId': productId
        });

        if (!hasPurchased) {
            return res.status(403).json({ success: false, error: { message: 'Only verified purchasers can review this product.' }});
        }

        // Create review (unique index prevents duplicates)
        const review = await Review.create({
            userId: req.user._id,
            productId,
            rating,
            title: title ? title.trim() : '',
            comment: comment.trim(),
            verifiedPurchase: true,
            moderationStatus: 'approved' // Default state
        });

        res.status(201).json({
            success: true,
            data: review,
            message: 'Review submitted successfully'
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: { message: 'You have already reviewed this product' }});
        }
        console.error(`Error in createReview: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error creating review' }});
    }
};

// @desc    Update a review
// @route   PATCH /api/v1/products/:productId/reviews/:reviewId
// @access  Private
export const updateReview = async (req, res) => {
    try {
        const { rating, title, comment } = req.body;

        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ success: false, error: { message: 'Review not found' }});
        }

        // Verify ownership
        if (review.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: { message: 'User not authorized to update this review' }});
        }

        if (rating) {
            if (rating < 1 || rating > 5) return res.status(400).json({ success: false, error: { message: 'Valid rating between 1 and 5 is required' }});
            review.rating = rating;
        }
        if (title !== undefined) review.title = title.trim();
        if (comment) {
            if (comment.trim().length < 2) return res.status(400).json({ success: false, error: { message: 'Comment is required and must be at least 2 characters' }});
            if (comment.length > 1000) return res.status(400).json({ success: false, error: { message: 'Comment is too long' }});
            review.comment = comment.trim();
        }
        review.isEdited = true;

        await review.save();

        res.json({
            success: true,
            data: review,
            message: 'Review updated successfully'
        });
    } catch (error) {
        console.error(`Error in updateReview: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error updating review' }});
    }
};

// @desc    Delete a review
// @route   DELETE /api/v1/products/:productId/reviews/:reviewId
// @access  Private
export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ success: false, error: { message: 'Review not found' }});
        }

        // Verify ownership
        if (review.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: { message: 'User not authorized to delete this review' }});
        }

        await review.deleteOne();

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error(`Error in deleteReview: ${error.message}`);
        res.status(500).json({ success: false, error: { message: 'Server error deleting review' }});
    }
};

// @desc    Report a review
// @route   POST /api/v1/reviews/:reviewId/report
// @access  Private
export const reportReview = async (req, res) => {
    try {
        const { reason } = req.body;
        
        if (!['inappropriate', 'spam', 'misleading', 'offensive', 'suspicious', 'other'].includes(reason)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid report reason' }});
        }

        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ success: false, error: { message: 'Review not found' }});

        await ReviewReport.create({
            reviewId: review._id,
            userId: req.user._id,
            reason
        });

        // Automatically flag the review if many reports occur? We will keep it simple and let admins handle it.
        
        res.json({ success: true, message: 'Review reported successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: { message: 'You have already reported this review' }});
        }
        res.status(500).json({ success: false, error: { message: 'Server error reporting review' }});
    }
};

// @desc    Vote on review helpfulness
// @route   POST /api/v1/reviews/:reviewId/helpful
// @access  Private
export const voteReview = async (req, res) => {
    try {
        const { value } = req.body;
        
        if (![1, -1].includes(value)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid vote value' }});
        }

        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ success: false, error: { message: 'Review not found' }});

        if (review.userId.toString() === req.user._id.toString()) {
            return res.status(403).json({ success: false, error: { message: 'You cannot vote on your own review' }});
        }

        const existingVote = await ReviewVote.findOne({ reviewId: review._id, userId: req.user._id });

        if (existingVote) {
            if (existingVote.value === value) {
                // If same vote, maybe un-vote (remove it)
                await existingVote.deleteOne();
                return res.json({ success: true, data: { userVote: 0 } });
            } else {
                existingVote.value = value;
                await existingVote.save();
                return res.json({ success: true, data: { userVote: value } });
            }
        }

        await ReviewVote.create({
            reviewId: review._id,
            userId: req.user._id,
            value
        });

        res.json({ success: true, data: { userVote: value } });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error voting on review' }});
    }
};
