import Review from '../models/Review.js';
import ReviewReport from '../models/ReviewReport.js';
import { recordAdminAction } from '../services/adminAuditService.js';
import Product from '../models/Product.js';

// @desc    Get all reviews for admin (with filters)
// @route   GET /api/v1/admin/reviews
export const getAdminReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const query = {};

        if (req.query.status && req.query.status !== 'ALL') {
            query.moderationStatus = req.query.status;
        }
        if (req.query.rating && req.query.rating !== 'ALL') {
            query.rating = parseInt(req.query.rating);
        }
        if (req.query.productId) {
            query.productId = req.query.productId;
        }

        const sort = req.query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

        const total = await Review.countDocuments(query);
        const reviews = await Review.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email');

        // Fetch report counts for these reviews
        const reviewIds = reviews.map(r => r._id);
        const reports = await ReviewReport.aggregate([
            { $match: { reviewId: { $in: reviewIds } } },
            { $group: { _id: '$reviewId', count: { $sum: 1 } } }
        ]);

        const formattedReviews = reviews.map(r => {
            const doc = r.toObject();
            const reportData = reports.find(rep => rep._id.toString() === r._id.toString());
            doc.reportCount = reportData ? reportData.count : 0;
            return doc;
        });

        res.json({
            success: true,
            data: {
                reviews: formattedReviews,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error retrieving reviews' }});
    }
};

// @desc    Update review moderation status
// @route   PATCH /api/v1/admin/reviews/:reviewId/moderation
export const updateReviewModeration = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['approved', 'pending', 'rejected', 'flagged'].includes(status)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid status' }});
        }

        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ success: false, error: { message: 'Review not found' }});

        const oldStatus = review.moderationStatus;
        review.moderationStatus = status;
        await review.save();

        await recordAdminAction({
            adminUserId: req.user._id,
            action: 'REVIEW_MODERATION_CHANGED',
            resourceType: 'Review',
            resourceId: review._id,
            previousState: { status: oldStatus },
            newState: { status: review.moderationStatus }
        });

        res.json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error moderating review' }});
    }
};

// @desc    Get reports for a specific review
// @route   GET /api/v1/admin/reviews/:reviewId/reports
export const getReviewReports = async (req, res) => {
    try {
        const reports = await ReviewReport.find({ reviewId: req.params.reviewId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, error: { message: 'Server error retrieving reports' }});
    }
};
