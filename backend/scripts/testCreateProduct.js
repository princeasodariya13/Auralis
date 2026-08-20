import dns from 'dns';
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e) {}
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auralis', {
            dbName: process.env.MONGODB_DB_NAME || 'auralis_audio'
        });
        
        // Import Product model dynamically to avoid issues
        const { default: Product } = await import('../src/models/Product.js');
        
        const lastProduct = await Product.findOne().sort({ id: -1 });
        const newId = lastProduct ? lastProduct.id + 1 : 1;

        console.log('Attempting to create product with ID:', newId);
        
        const product = await Product.create({
            id: newId,
            name: "Auralis Production Test Headphones",
            price: Number("19999"),
            category: "Headphones",
            image: "",
            images: [],
            description: "Production admin creation verification",
            shortDescription: undefined,
            brand: "Sony",
            specifications: [],
            features: [],
            isBestSeller: false,
            stockQuantity: Number("10"),
            lowStockThreshold: Number("5"),
            sku: `TEST-${Date.now()}`,
            isActive: true
        });

        console.log('Success!', product.id);
        
        // Cleanup test product
        await Product.deleteOne({ id: product.id });
        
    } catch(err) {
        console.error('Validation Error details:', err);
    } finally {
        mongoose.disconnect();
    }
};

run();
