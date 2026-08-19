import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const brands = ['Audeze', 'Sennheiser', 'Focal', 'Sony', 'Hifiman', 'Bowers & Wilkins', 'Meze Audio', 'Dan Clark Audio', 'Audio-Technica', 'Campfire Audio', 'Chord Electronics', 'Fiio', 'iFi Audio', 'Kef', 'Q Acoustics', 'KEF', 'Klipsch'];

const categories = {
    'Over-Ear Headphones': { base: 25000, variance: 75000 },
    'Wireless Headphones': { base: 15000, variance: 30000 },
    'IEMs': { base: 5000, variance: 95000 },
    'Earbuds': { base: 2000, variance: 15000 },
    'Bluetooth Speakers': { base: 8000, variance: 25000 },
    'Bookshelf Speakers': { base: 30000, variance: 120000 },
    'Floorstanding Speakers': { base: 80000, variance: 220000 },
    'DACs': { base: 10000, variance: 140000 },
    'Amplifiers': { base: 15000, variance: 180000 },
    'Turntables': { base: 20000, variance: 130000 },
    'Cables': { base: 1000, variance: 15000 },
    'Accessories': { base: 500, variance: 5000 }
};

const adjectives = ['Reference', 'Signature', 'Pro', 'Elite', 'Classic', 'Studio', 'Monitor', 'Evolution', 'Master', 'Aura', 'Nova', 'Zenith', 'Quantum', 'Phantom', 'Nexus'];

const models = ['HD', 'LCD', 'HE', 'SE', 'K', 'M', 'T', 'X', 'Z'];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateProductName = (brand, category) => {
    const adj = adjectives[getRandomInt(0, adjectives.length - 1)];
    const mod = models[getRandomInt(0, models.length - 1)];
    const num = getRandomInt(10, 999) * 10;
    return `${brand} ${mod}-${num} ${adj} ${category.replace('es', '').replace('s', '')}`;
};

const generateProduct = (id) => {
    const categoryNames = Object.keys(categories);
    const category = categoryNames[getRandomInt(0, categoryNames.length - 1)];
    const brand = brands[getRandomInt(0, brands.length - 1)];
    const name = generateProductName(brand, category);
    const basePrice = categories[category].base;
    const priceVariance = categories[category].variance;
    // Round to nearest 99
    const rawPrice = basePrice + getRandomInt(0, priceVariance);
    const price = Math.floor(rawPrice / 100) * 100 + 99;
    
    // Removed fallback images to strictly comply with "Do not use fake Cloudinary URLs"
    
    return {
        id: 100 + id,
        name,
        price,
        category,
        brand,
        image: '',
        images: [],
        description: `Experience the pinnacle of audio engineering with the ${name}. Crafted by ${brand}, this premium ${category.toLowerCase()} delivers unparalleled clarity, expansive soundstage, and reference-grade accuracy. Perfect for discerning audiophiles who demand nothing but the absolute best in their listening experience.`,
        shortDescription: `Premium ${brand} ${category.toLowerCase()} with reference-grade audio quality.`,
        isBestSeller: Math.random() > 0.8,
        stockQuantity: getRandomInt(5, 50),
        lowStockThreshold: 5,
        sku: `${brand.substring(0, 3).toUpperCase()}-${category.substring(0, 3).toUpperCase()}-${1000 + id}`,
        isActive: true,
        specifications: [
            { name: "Brand", value: brand },
            { name: "Category", value: category },
            { name: "Warranty", value: "2 Years" }
        ],
        features: [
            "Reference-grade audio tuning",
            "Premium build quality",
            "Audiophile grade components"
        ],
        rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5 to 5.0
        numReviews: getRandomInt(0, 150)
    };
};

const products = [];
for (let i = 1; i <= 100; i++) {
    products.push(generateProduct(i));
}

const outputPath = path.join(__dirname, 'productsSeedData.json');
fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));

console.log(`Successfully generated 100 products to ${outputPath}`);
