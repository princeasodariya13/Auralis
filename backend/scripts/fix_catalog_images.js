import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch(e){}
dotenv.config();

const HD_CATEGORY_IMAGES = {
    Headphones: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1590658006821-04f4008d5717?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=1200&q=85',
    ],
    Speakers: [
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=1200&q=85',
    ],
    Earphones: [
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=85',
    ],
    Earbuds: [
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1200&q=85',
    ],
    Default: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85',
    ]
};

const getCategoryPool = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('headphone')) return HD_CATEGORY_IMAGES.Headphones;
    if (cat.includes('speaker')) return HD_CATEGORY_IMAGES.Speakers;
    if (cat.includes('earphone')) return HD_CATEGORY_IMAGES.Earphones;
    if (cat.includes('earbud')) return HD_CATEGORY_IMAGES.Earbuds;
    return HD_CATEGORY_IMAGES.Default;
};

const run = async () => {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME || 'auralis_audio' });
        const db = mongoose.connection;
        const collection = db.collection('products');

        const allProducts = await collection.find({}).toArray();
        console.log(`Processing ${allProducts.length} catalog items for HD image fixes...`);

        let fixedCount = 0;
        const bulkOps = [];

        for (const p of allProducts) {
            const img = (p.image || '').trim();
            const isPlaceholder = !img || 
                                  img.includes('itemImgPlaceholder') || 
                                  img.includes('loading') || 
                                  img.includes('placeholder') || 
                                  img.includes('no_image') || 
                                  img.includes('noimage') || 
                                  img.includes('default') || 
                                  img.includes('smallimages');

            if (isPlaceholder) {
                const pool = getCategoryPool(p.category);
                const hdUrl = pool[Math.abs(p.id) % pool.length];

                // Create secondary gallery images as well
                const secondaryHdUrl = pool[(Math.abs(p.id) + 1) % pool.length];
                const imagesArray = [
                    { url: hdUrl, alt: p.name },
                    { url: secondaryHdUrl, alt: `${p.name} Studio View` }
                ];

                bulkOps.push({
                    updateOne: {
                        filter: { _id: p._id },
                        update: { 
                            $set: { 
                                image: hdUrl,
                                images: imagesArray
                            } 
                        }
                    }
                });

                fixedCount++;
            }
        }

        if (bulkOps.length > 0) {
            console.log(`Executing bulk update for ${bulkOps.length} products...`);
            await collection.bulkWrite(bulkOps);
            console.log(`Successfully updated ${fixedCount} product images in MongoDB!`);
        } else {
            console.log('No placeholder images found needing update.');
        }

    } catch (err) {
        console.error('Error fixing catalog images:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
};

run();
