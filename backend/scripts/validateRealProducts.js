import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Product from '../src/models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const validateRealProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/auralis');
        console.log('Connected to DB for validation.');

        const activeProducts = await Product.find({ isActive: true });
        
        const errors = [];
        const skus = new Set();
        const names = new Set();
        
        const fictionalKeywords = ['T-6060', 'X-9999', 'Ultra Pro Max 9000', 'Auralis X-Series', 'Generic', 'Premium Audio 5000'];

        for (const p of activeProducts) {
            if (p.price <= 0) errors.push(`Invalid price for SKU ${p.sku}`);
            if (skus.has(p.sku)) errors.push(`Duplicate SKU ${p.sku}`);
            skus.add(p.sku);
            
            if (names.has(p.name)) errors.push(`Duplicate Name ${p.name}`);
            names.add(p.name);
            
            if (p.image && p.image.includes('unsplash.com')) errors.push(`Unsplash URL found in ${p.sku}`);
            
            const hasFictional = fictionalKeywords.some(kw => p.name.includes(kw) || (p.description && p.description.includes(kw)));
            if (hasFictional) errors.push(`Suspicious fictional keyword in ${p.sku}`);
        }
        
        const validationReport = {
            totalActiveProducts: activeProducts.length,
            allValidNames: activeProducts.every(p => p.name && p.name.length > 2),
            allValidBrands: activeProducts.every(p => p.brand && p.brand.length > 2),
            allSkusUnique: skus.size === activeProducts.length,
            allPricesValid: activeProducts.every(p => p.price > 0),
            noFictionalNames: errors.filter(e => e.includes('Suspicious')).length === 0,
            noDuplicateProducts: names.size === activeProducts.length,
            noFakeImageUrls: errors.filter(e => e.includes('Unsplash')).length === 0,
            errors
        };

        const outPath = path.join(__dirname, '..', '..', 'AURALIS_STEP59E_PRODUCT_VALIDATION.json');
        fs.writeFileSync(outPath, JSON.stringify(validationReport, null, 2));
        
        console.log(`Validation complete. Found ${errors.length} errors.`);
        process.exit(0);
    } catch (err) {
        console.error('Validation failed:', err);
        process.exit(1);
    }
};

validateRealProducts();
