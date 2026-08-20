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
        
        const { createProduct } = await import('../src/controllers/adminProductController.js');

        const req = {
            user: { _id: new mongoose.Types.ObjectId() }, // Mock admin user
            body: {
                name: 'Test Product Controller',
                sku: 'SKU-CTRL-' + Date.now(),
                price: '199',
                category: 'Audio',
                brand: 'Sony',
                shortDescription: '',
                stockQuantity: '10',
                lowStockThreshold: '2',
                isActive: 'true',
                isBestSeller: 'false',
                description: 'Test description',
                // note: image, specifications, features are missing, mimicking frontend
            },
            file: null // No image upload
        };

        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                console.log(`Response [${this.statusCode}]:`, JSON.stringify(data, null, 2));
            }
        };

        // Monkey-patch console.error to see what createProduct logs internally
        const origError = console.error;
        console.error = (...args) => {
            origError('[TEST CONTROLLER ERROR LOG]:', ...args);
        };

        await createProduct(req, res);
        
    } catch(err) {
        console.error('Unhandled script error:', err);
    } finally {
        mongoose.disconnect();
    }
};

run();
