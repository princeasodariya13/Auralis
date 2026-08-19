import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Product from '../src/models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const generateReviewList = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/auralis');
        console.log('Connected to DB for review list generation.');

        const activeProducts = await Product.find({ isActive: true });
        
        const reviewRequired = [];

        for (const p of activeProducts) {
            // Check if product has no verified images
            if (!p.image && (!p.images || p.images.length === 0)) {
                reviewRequired.push({
                    sku: p.sku,
                    productName: p.name,
                    brand: p.brand,
                    reason: "No exact verified image source available in current environment."
                });
            }
        }
        
        const outPath = path.join(__dirname, '..', '..', 'MANUAL_PRODUCT_IMAGE_REVIEW_REQUIRED.json');
        fs.writeFileSync(outPath, JSON.stringify(reviewRequired, null, 2));
        
        console.log(`Generated manual review list with ${reviewRequired.length} products.`);
        process.exit(0);
    } catch (err) {
        console.error('Failed to generate review list:', err);
        process.exit(1);
    }
};

generateReviewList();
