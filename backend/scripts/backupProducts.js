import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const backupProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/auralis');
        console.log('Connected to DB');

        const db = mongoose.connection.db;
        const products = await db.collection('products').find({}).toArray();

        const backupPath = path.join(__dirname, '..', '..', 'AURALIS_STEP59E_PRODUCT_BACKUP.json');
        
        const backupData = products.map(p => ({
            _id: p._id,
            productName: p.name,
            sku: p.sku,
            price: p.price,
            image: p.image,
            images: p.images,
            stockQuantity: p.stockQuantity,
            category: p.category,
            createdAt: p.createdAt
        }));

        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        console.log(`Successfully backed up ${products.length} products to ${backupPath}`);
        
        process.exit(0);
    } catch (err) {
        console.error('Backup failed:', err);
        process.exit(1);
    }
}

backupProducts();
