/**
 * RECOVERY SCRIPT: Restore original 118 products with images
 * 
 * The seedRealProducts script deactivated the original 118 products (which had images)
 * because their SKUs didn't match the 116 products in realProductData.js.
 * Then it inserted 116 new products without images.
 * 
 * This script:
 * 1. Reactivates all 118 original products (restoring images and data)
 * 2. Deactivates (marks inactive) the 116 newly inserted imageless duplicates
 * 
 * Identity: original products = have images (590 total) 
 *           newly seeded = have 0 images AND were created after the seed run
 */
import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const run = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auralis', {
            dbName: process.env.MONGODB_DB_NAME || 'auralis_audio'
        });
        console.log('Connected.');

        const db = mongoose.connection.db;
        const col = db.collection('products');

        // Step 1: Reactivate all products that have images (the originals)
        const withImagesResult = await col.updateMany(
            { images: { $exists: true, $not: { $size: 0 } } },
            { $set: { isActive: true } }
        );
        console.log(`Reactivated ${withImagesResult.modifiedCount} products with images.`);

        // Step 2: Deactivate products that have 0 images (the newly seeded ones)
        const noImagesResult = await col.updateMany(
            { $or: [{ images: { $size: 0 } }, { images: { $exists: false } }] },
            { $set: { isActive: false } }
        );
        console.log(`Deactivated ${noImagesResult.modifiedCount} products without images.`);

        // Final audit
        const total = await col.countDocuments();
        const active = await col.countDocuments({ isActive: true });
        const withImages = await col.countDocuments({ images: { $exists: true, $not: { $size: 0 } } });
        
        console.log('\n=== POST-RECOVERY AUDIT ===');
        console.log(`Total products:      ${total}`);
        console.log(`Active products:     ${active}`);
        console.log(`With images:         ${withImages}`);
        console.log(`Without images:      ${total - withImages}`);
        console.log('===========================');

    } catch(err) {
        console.error('Recovery failed:', err.message);
        process.exit(1);
    } finally {
        mongoose.disconnect();
    }
};

run();
