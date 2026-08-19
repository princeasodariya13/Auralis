import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables (assuming .env is in backend root)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Must load Product model AFTER connecting or alongside it, but since we're importing it, we just need to ensure MongoDB URI is available
import Product from '../src/models/Product.js';

const seedProducts = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/auralis';
        console.log(`Connecting to MongoDB...`);
        await mongoose.connect(mongoUri);
        console.log('Connected.');

        const dataPath = path.join(__dirname, 'productsSeedData.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const products = JSON.parse(rawData);

        console.log(`Found ${products.length} products to seed.`);
        
        let insertedCount = 0;
        let updatedCount = 0;

        for (const prod of products) {
            // We use SKU as the unique identifier for updating existing seeded products safely
            // Using upsert ensures we don't delete existing production data.
            const result = await Product.updateOne(
                { sku: prod.sku },
                { $set: prod },
                { upsert: true }
            );
            
            if (result.upsertedCount > 0) {
                insertedCount++;
            } else if (result.modifiedCount > 0) {
                updatedCount++;
            }
        }

        console.log(`Seeding complete. Inserted: ${insertedCount}, Updated: ${updatedCount}`);
        process.exit(0);
    } catch (error) {
        console.error(`Error during seeding: ${error.message}`);
        process.exit(1);
    }
};

seedProducts();
