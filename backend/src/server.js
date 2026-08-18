import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Only listen if not in a Vercel Serverless environment
// Vercel sets various environment variables, or we can just check if we are in production
// But if it's a Vercel Service (long running), it DOES need app.listen.
// If it's Vercel Serverless, it needs export default app.
// Doing both is safe for express.
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_URL || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
}

// Export for Vercel Serverless compatibility
export default app;
