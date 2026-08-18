import Review from '../models/Review.js';
import Product from '../models/Product.js';

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
        const total = await Review.countDocuments({ productId });
        const reviews = await Review.find({ productId })
            .populate('userId', 'name') // Only get user's name
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Calculate distribution and average lazily
        const allReviews = await Review.find({ productId }).select('rating');
        const ratingCount = allReviews.length;
        const averageRating = ratingCount > 0 
            ? (allReviews.reduce((sum, rev) => sum + rev.rating, 0) / ratingCount).toFixed(1) 
            : 0;
            
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        allReviews.forEach(r => { distribution[r.rating]++; });

        res.json({
            success: true,
            data: {
                reviews,
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

        // Create review (unique index prevents duplicates)
        const review = await Review.create({
            userId: req.user._id,
            productId,
            rating,
            title: title ? title.trim() : '',
            comment: comment.trim()
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
