import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Use Google DNS to bypass local DNS issues (same as db.js)
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const run = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auralis', {
            dbName: process.env.MONGODB_DB_NAME || 'auralis_audio'
        });
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        
        const products = await db.collection('products').find({}).toArray();
        const total = products.length;
        const active = products.filter(p => p.isActive).length;
        const inactive = total - active;
        
        const skus = new Set(products.map(p => p.sku));
        const uniqueSkus = skus.size;
        const duplicateSkus = total - uniqueSkus;
        
        const withImages = products.filter(p => p.images && p.images.length > 0).length;
        const withoutImages = total - withImages;
        
        const totalImages = products.reduce((acc, p) => acc + (p.images ? p.images.length : 0), 0);
        const avgImages = total > 0 ? (totalImages / total).toFixed(2) : 0;
        
        const invalidPrices = products.filter(p => !p.price || p.price <= 0).length;
        const negativeStock = products.filter(p => p.stockQuantity < 0).length;
        const missingName = products.filter(p => !p.name).length;
        const missingBrand = products.filter(p => !p.brand).length;
        
        console.log('\n=== DATABASE AUDIT REPORT ===');
        console.log(`Total products:           ${total}`);
        console.log(`Active products:          ${active}`);
        console.log(`Inactive products:        ${inactive}`);
        console.log(`Unique SKUs:              ${uniqueSkus}`);
        console.log(`Duplicate SKUs:           ${duplicateSkus}`);
        console.log(`Products with images:     ${withImages}`);
        console.log(`Products without images:  ${withoutImages}`);
        console.log(`Total images:             ${totalImages}`);
        console.log(`Avg images/product:       ${avgImages}`);
        console.log(`Invalid prices (<=0):     ${invalidPrices}`);
        console.log(`Negative stock:           ${negativeStock}`);
        console.log(`Missing name:             ${missingName}`);
        console.log(`Missing brand:            ${missingBrand}`);
        console.log('=============================\n');
        
    } catch(err) {
        console.error('Audit failed:', err.message);
        process.exit(1);
    } finally {
        mongoose.disconnect();
    }
}
run();
