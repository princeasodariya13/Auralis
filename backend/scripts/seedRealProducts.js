import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../src/models/Product.js';
import { realProducts } from './realProductData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedRealProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/auralis');
        console.log('Connected to DB for seeding real products.');

        const db = mongoose.connection.db;

        const existingProducts = await Product.find({});
        
        let existingFictionalCount = 0;
        let activeFictionalDeactivated = 0;

        const newSkus = new Set(realProducts.map(p => p.sku));

        for (const p of existingProducts) {
            if (!newSkus.has(p.sku)) {
                existingFictionalCount++;
                if (p.isActive) {
                    p.isActive = false;
                    await p.save();
                    activeFictionalDeactivated++;
                }
            }
        }
        
        console.log(`Deactivated ${activeFictionalDeactivated} existing fictional products.`);

        let maxId = 0;
        if (existingProducts.length > 0) {
            maxId = Math.max(...existingProducts.map(p => p.id || 0));
        }

        let newProductsCount = 0;
        let updatedProductsCount = 0;

        for (const p of realProducts) {
            if (!p.name || !p.brand || !p.cat || !p.sku || !p.price) {
                throw new Error(`Product missing required fields: ${JSON.stringify(p)}`);
            }
            if (p.price <= 0) {
                throw new Error(`Product price invalid: ${p.sku}`);
            }

            const existing = await Product.findOne({ sku: p.sku });
            
            if (existing) {
                existing.name = p.name;
                existing.brand = p.brand;
                existing.category = p.cat;
                existing.description = p.short || `${p.name} by ${p.brand}. Premium audio equipment.`;
                existing.shortDescription = p.short;
                existing.price = p.price;
                existing.isActive = true;
                if (!existing.stockQuantity) {
                    existing.stockQuantity = Math.floor(Math.random() * 20) + 10;
                }
                await existing.save();
                updatedProductsCount++;
            } else {
                maxId++;
                const newProduct = new Product({
                    id: maxId,
                    name: p.name,
                    brand: p.brand,
                    category: p.cat,
                    sku: p.sku,
                    price: p.price,
                    description: p.short || `${p.name} by ${p.brand}. Premium audio equipment.`,
                    shortDescription: p.short,
                    image: '',
                    images: [],
                    stockQuantity: Math.floor(Math.random() * 20) + 10,
                    isActive: true,
                    isBestSeller: Math.random() > 0.8
                });
                await newProduct.save();
                newProductsCount++;
            }
        }

        console.log(`Successfully seeded real catalog. Inserted: ${newProductsCount}, Updated: ${updatedProductsCount}`);
        process.exit(0);
    } catch (err) {
        console.error('Failed to seed real products:', err);
        process.exit(1);
    }
};

seedRealProducts();
