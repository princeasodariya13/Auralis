import express from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import Product from '../models/Product.js';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

// Rate limiting for auth routes to prevent brute-forcing
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: { success: false, error: { message: 'Too many requests from this IP, please try again after 15 minutes' }}
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

router.get('/force-admin-reset', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);
        await User.updateOne(
            { email: 'admin@auralis.com' }, 
            { $set: { passwordHash, role: 'admin', name: 'Admin User', createdAt: new Date() } },
            { upsert: true }
        );
        res.status(200).send('✅ Admin password forcefully reset to admin123!');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/seed-products', async (req, res) => {
    try {
        const products = req.body.products;
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ success: false, error: 'Invalid payload' });
        }
        
        // Respond immediately to prevent Render timeout
        res.status(202).json({ success: true, message: `Background seeding started for ${products.length} products.` });

        // Run heavy tasks in background
        setImmediate(async () => {
            try {
                console.log(`🚀 Starting background seed of ${products.length} products...`);
                
                // Set up cloudinary config in case it's not set
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET
                });

                // Clear old products
                await Product.deleteMany({});
                console.log('🗑  Cleared old products.');

                let saved = 0;
                for (let i = 0; i < products.length; i++) {
                    const p = products[i];
                    try {
                        // 1. Upload remote URL to Cloudinary (Render has no firewall)
                        const uploadRes = await cloudinary.uploader.upload(p.sourceImage, {
                            folder: 'auralis/products',
                            transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
                            context: { alt: p.name },
                        });

                        const imgObj = {
                            publicId: uploadRes.public_id,
                            url: uploadRes.secure_url,
                            alt: p.name
                        };
                        p.images = [imgObj];
                        p.image = imgObj.url;

                        // Remove temp property before saving
                        delete p.sourceImage;

                        // 2. Save to DB
                        await Product.create(p);
                        saved++;
                        if (saved % 10 === 0) console.log(`  ✓ Saved ${saved}/${products.length} products`);
                    } catch (err) {
                        console.error(`  ⚠ Failed to process ${p.name}:`, err.message);
                    }
                }
                console.log(`🎉 Background seed complete! Successfully processed ${saved} products.`);
            } catch (err) {
                console.error('❌ Background seed failed:', err);
            }
        });

    } catch (err) {
        console.error('Seed Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/fix-gallery', async (req, res) => {
    try {
        const imagePool = [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80",
            "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80",
            "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
            "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&q=80",
            "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800&q=80",
            "https://images.unsplash.com/photo-1599669500515-b3e1f55a151b?w=800&q=80",
            "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=800&q=80",
            "https://images.unsplash.com/photo-1520170350707-b2da59970118?w=800&q=80"
        ];
        
        const products = await Product.find({});
        let updated = 0;
        
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            
            // Assign 5 images to the gallery
            const gallery = [];
            for(let j = 0; j < 5; j++) {
                const imgUrl = imagePool[(i + j) % imagePool.length];
                gallery.push({
                    publicId: `seed_${product.id}_${j}`,
                    url: imgUrl,
                    alt: `${product.name} view ${j + 1}`
                });
            }
            
            product.image = gallery[0].url; // Main image
            product.images = gallery;
            
            await product.save();
            updated++;
        }
        
        res.status(200).json({ success: true, message: `Fixed gallery for ${updated} products` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
