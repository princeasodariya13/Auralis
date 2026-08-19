import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Product from '../src/models/Product.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'product-assets');
const CLOUDINARY_FOLDER = 'auralis/products';

const uploadProductImages = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/auralis');
        console.log('Connected.');

        if (!fs.existsSync(UPLOAD_DIR)) {
            console.error(`Upload directory not found: ${UPLOAD_DIR}`);
            console.log(`Please create the directory and place images in the format:`);
            console.log(`product-assets/`);
            console.log(`  <sku>/`);
            console.log(`    1.jpg`);
            console.log(`    2.jpg`);
            process.exit(1);
        }

        const skus = fs.readdirSync(UPLOAD_DIR);
        const results = [];

        for (const sku of skus) {
            const skuPath = path.join(UPLOAD_DIR, sku);
            if (!fs.statSync(skuPath).isDirectory()) continue;

            console.log(`Processing SKU: ${sku}`);
            const product = await Product.findOne({ sku });
            
            if (!product) {
                console.warn(`Product with SKU ${sku} not found. Skipping.`);
                continue;
            }

            const files = fs.readdirSync(skuPath).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));
            if (files.length === 0) {
                console.warn(`No valid images found for SKU ${sku}`);
                continue;
            }

            const uploadedImages = [];

            for (const [index, file] of files.entries()) {
                const filePath = path.join(skuPath, file);
                try {
                    const expectedPublicId = `${CLOUDINARY_FOLDER}/${sku}/${file.split('.')[0]}`;
                    const isDuplicate = product.images && product.images.some(img => img.publicId === expectedPublicId);

                    if (isDuplicate) {
                        console.log(`  SKIPPED — already uploaded: ${file}`);
                        uploadedImages.push(product.images.find(img => img.publicId === expectedPublicId));
                        continue;
                    }

                    console.log(`  Uploading ${file}...`);
                    const { uploadImage } = await import('../src/services/cloudinary.service.js');
                    const result = await uploadImage(filePath, `${CLOUDINARY_FOLDER}/${sku}`, {
                        public_id: file.split('.')[0]
                    });
                    
                    uploadedImages.push({
                        publicId: result.publicId,
                        url: result.url,
                        width: result.width,
                        height: result.height,
                        alt: `${product.name} - View ${index + 1}`
                    });
                } catch (err) {
                    console.error(`  Failed to upload ${file}:`, err.message);
                }
            }

            if (uploadedImages.length > 0) {
                product.image = uploadedImages[0].url; // Primary image backward compatibility
                product.images = uploadedImages;
                await product.save();
                console.log(`  Successfully updated ${sku} with ${uploadedImages.length} images.`);
                
                results.push({
                    sku,
                    success: true,
                    count: uploadedImages.length
                });
            }
        }

        const manifestPath = path.join(__dirname, 'upload-manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));
        console.log(`\nUpload process complete. Manifest saved to ${manifestPath}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Fatal error during upload process:', error);
        process.exit(1);
    }
};

uploadProductImages();
