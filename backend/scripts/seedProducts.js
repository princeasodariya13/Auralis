import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });



// Free, reliable audiophile product images from Unsplash (stable CDN URLs)
const imagePool = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800',
    'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',
    'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800',
    'https://images.unsplash.com/photo-1491927570842-0261e477d937?w=800',
    'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800',
    'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800',
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
    'https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=800',
    'https://images.unsplash.com/photo-1519183071298-a2962a3aca5c?w=800',
    'https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=800',
    'https://images.unsplash.com/photo-1564424224827-cd24b8915874?w=800',
    'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800',
    'https://images.unsplash.com/photo-1560343787-04f00c23f7b2?w=800',
    'https://images.unsplash.com/photo-1507646871843-cdeb4a89b47b?w=800',
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800',
    'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800',
];

const brands = ['Audeze', 'Sennheiser', 'Focal', 'Sony', 'HiFiMAN', 'Bowers & Wilkins', 'Meze Audio', 'Dan Clark Audio', 'Audio-Technica', 'Campfire Audio', 'Chord Electronics', 'FiiO', 'iFi Audio', 'KEF', 'Q Acoustics', 'Klipsch', 'Beyerdynamic', 'AKG'];

const categoryConfig = {
    'Headphones': { base: 25000, variance: 75000, tag: 'Over-ear reference headphones' },
    'Wireless Headphones': { base: 15000, variance: 30000, tag: 'Premium wireless audio' },
    'IEMs': { base: 5000, variance: 95000, tag: 'In-ear monitor' },
    'Earbuds': { base: 2000, variance: 15000, tag: 'True wireless earbuds' },
    'Speakers': { base: 20000, variance: 100000, tag: 'Hi-fi speakers' },
    'DACs': { base: 10000, variance: 140000, tag: 'Digital to analog converter' },
    'Amplifiers': { base: 15000, variance: 180000, tag: 'Headphone amplifier' },
    'Accessories': { base: 1000, variance: 8000, tag: 'Audio accessory' },
};

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rnd(0, arr.length - 1)];

const specs = {
    'Headphones': [
        { name: 'Driver Type', value: 'Planar Magnetic' },
        { name: 'Frequency Response', value: '5Hz - 50kHz' },
        { name: 'Impedance', value: '32 Ohm' },
        { name: 'Sensitivity', value: '102 dB/mW' },
        { name: 'Weight', value: '385g' },
        { name: 'Cable Length', value: '3m' },
        { name: 'Connector', value: '6.3mm TRS' },
    ],
    'Wireless Headphones': [
        { name: 'Driver Type', value: 'Dynamic' },
        { name: 'Frequency Response', value: '20Hz - 20kHz' },
        { name: 'Bluetooth', value: '5.3' },
        { name: 'Battery Life', value: '30 Hours' },
        { name: 'Codec Support', value: 'AAC, aptX HD, LDAC' },
        { name: 'Weight', value: '250g' },
        { name: 'ANC', value: 'Active Noise Cancellation' },
    ],
    'IEMs': [
        { name: 'Driver Type', value: 'Balanced Armature + Dynamic' },
        { name: 'Frequency Response', value: '10Hz - 40kHz' },
        { name: 'Impedance', value: '16 Ohm' },
        { name: 'Sensitivity', value: '108 dB/mW' },
        { name: 'Connector', value: '2-pin 0.78mm' },
        { name: 'Cable', value: 'Silver-plated OFC' },
    ],
    'Earbuds': [
        { name: 'Driver Size', value: '10mm' },
        { name: 'Bluetooth', value: '5.2' },
        { name: 'Battery Life', value: '8+24 Hours' },
        { name: 'Water Resistance', value: 'IPX5' },
        { name: 'Weight', value: '5.4g per bud' },
    ],
    'Speakers': [
        { name: 'Configuration', value: '2-way Bookshelf' },
        { name: 'Frequency Response', value: '45Hz - 28kHz' },
        { name: 'Power Handling', value: '100W RMS' },
        { name: 'Impedance', value: '8 Ohm' },
        { name: 'Sensitivity', value: '87 dB' },
        { name: 'Dimensions', value: '310 x 190 x 260mm' },
    ],
    'DACs': [
        { name: 'Resolution', value: '32-bit / 768kHz PCM' },
        { name: 'DSD Support', value: 'DSD512' },
        { name: 'SNR', value: '125 dB' },
        { name: 'THD+N', value: '-120 dB' },
        { name: 'Inputs', value: 'USB-C, Optical, Coaxial' },
        { name: 'Outputs', value: 'RCA, XLR Balanced' },
    ],
    'Amplifiers': [
        { name: 'Output Power', value: '4W per channel' },
        { name: 'Frequency Response', value: '1Hz - 500kHz' },
        { name: 'THD', value: '< 0.001%' },
        { name: 'Inputs', value: 'RCA, XLR' },
        { name: 'Outputs', value: '6.3mm, 4.4mm Balanced' },
        { name: 'Gain', value: 'Low/High selectable' },
    ],
    'Accessories': [
        { name: 'Material', value: 'Premium Copper' },
        { name: 'Connector', value: '4.4mm Pentaconn' },
        { name: 'Length', value: '1.2m' },
        { name: 'Shielding', value: 'Multi-layer' },
    ],
};

const features = {
    'Headphones': ['Planar magnetic driver technology', 'Open-back soundstage design', 'Detachable cable system', 'Aluminum & carbon fiber chassis', 'Premium lambskin ear cushions', 'Zero harmonic distortion'],
    'Wireless Headphones': ['Active Noise Cancellation 2.0', 'Multipoint Bluetooth connectivity', 'LDAC hi-res audio codec', 'Ambient transparency mode', 'Auto-pause on removal', '30-hour battery with fast charge'],
    'IEMs': ['Tribrid driver configuration', 'Custom-fit option available', 'MMCX/2-pin detachable cable', '7Hz - 40kHz frequency range', 'Precision CNC machined shell', 'Replaceable filter tuning system'],
    'Earbuds': ['IPX5 water resistance', 'Adaptive EQ with real-time adjustment', 'Spatial audio with head tracking', 'Wireless charging case', 'Voice isolation microphone system', 'Ear tip fit test'],
    'Speakers': ['Uni-Q coincident driver array', 'Uni-Core force-cancelling woofer', 'DSP amplification with room correction', 'Magnetically-attached grille', 'Bi-wire terminal posts', 'MDF cabinet with resonance dampening'],
    'DACs': ['XMOS XU316 USB controller', 'Dual ESS9038PRO DAC chips', 'Fully balanced architecture', 'MQA full decoder', 'Roon ready compatible', 'Ultra-low phase noise oscillators'],
    'Amplifiers': ['Pure Class-A topology', 'Dual-mono design', 'Fully discrete output stage', 'Toroidal power transformer', 'Alps RK27 volume potentiometer', 'Relay-based input switching'],
    'Accessories': ['Palladium plated contacts', 'Linear crystal copper conductors', 'Anti-vibration casing', 'Hand-terminated with care', 'Lifetime warranty'],
};

const buildProducts = () => {
    const products = [];
    const categoryKeys = Object.keys(categoryConfig);
    let id = 1;

    // Generate roughly 115 products
    for (const cat of categoryKeys) {
        const count = cat === 'Headphones' ? 20 : cat === 'IEMs' ? 20 : cat === 'Wireless Headphones' ? 18 : 12;
        for (let i = 0; i < count; i++) {
            const brand = pick(brands);
            const cfg = categoryConfig[cat];
            const rawPrice = cfg.base + rnd(0, cfg.variance);
            const price = Math.floor(rawPrice / 100) * 100 + 99;
            const modelNum = rnd(100, 999);
            const series = pick(['HD', 'LCD', 'HE', 'K', 'M', 'T', 'X', 'Z', 'SE', 'Pro', 'Elite']);
            const name = `${brand} ${series}${modelNum} ${pick(['Reference', 'Signature', 'Studio', 'Monitor', 'Classic', 'Anniversary'])}`;

            products.push({
                id: 1000 + id++,
                name,
                price,
                category: cat,
                brand,
                image: '',
                images: [],
                description: `Experience the pinnacle of audio engineering with the ${name}. Crafted by ${brand}, this premium ${cat.toLowerCase()} delivers unparalleled clarity, expansive soundstage, and reference-grade accuracy for the discerning audiophile.`,
                shortDescription: `${cfg.tag} by ${brand}. Reference-grade audio quality.`,
                isBestSeller: Math.random() > 0.8,
                stockQuantity: rnd(5, 60),
                lowStockThreshold: 5,
                sku: `${brand.substring(0,3).toUpperCase()}-${cat.substring(0,3).toUpperCase()}-${1000 + id}`,
                isActive: true,
                specifications: specs[cat] || specs['Accessories'],
                features: (features[cat] || features['Accessories']).slice(0, 4),
                rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
                numReviews: rnd(0, 220),
            });
        }
    }
    return products;
};

const run = async () => {
    const products = buildProducts();
    
    // Assign an Unsplash URL to each product for the backend to upload
    console.log(`\n📦 Generated ${products.length} products. Assigning images...`);
    
    for (let i = 0; i < products.length; i++) {
        // Pick a random image from the pool
        products[i].sourceImage = imagePool[i % imagePool.length];
    }
    
    console.log('🚀 Sending products to Render Backend via API...');
    
    try {
        const response = await fetch('https://auralis-vm96.onrender.com/api/v1/auth/seed-products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ products })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`\n🎉 Success! ${data.message}`);
            console.log('Monitor the Render logs to see Cloudinary upload and MongoDB insertion progress.');
        } else {
            console.error('\n❌ Server returned an error:', data.error);
        }
    } catch (err) {
        console.error('\n❌ Failed to contact Render API:', err.message);
    }

    process.exit(0);
};

run().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
