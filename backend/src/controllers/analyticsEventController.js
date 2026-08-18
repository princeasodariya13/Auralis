import AnalyticsEvent from '../models/AnalyticsEvent.js';

export const logEvent = async (req, res) => {
    try {
        const { eventType, productId } = req.body;
        
        const validEvents = ['PRODUCT_VIEWED', 'CHECKOUT_STARTED']; // Only allow frontend events
        if (!validEvents.includes(eventType)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid event type' }});
        }
        
        const userId = req.user ? req.user._id : undefined;
        
        // Use insertOne directly for performance, ignore errors
        await AnalyticsEvent.create({
            eventType,
            productId,
            userId
        });
        
        res.status(200).json({ success: true });
    } catch (error) {
        // Analytics failures must NEVER break the client experience
        console.error(`Analytics Logging Error: ${error.message}`);
        res.status(200).json({ success: true, warning: 'Analytics failed but operation allowed' });
    }
};
