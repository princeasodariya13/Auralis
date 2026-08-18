export const products = [
    {
        id: 1,
        name: "ANC Pro Headphones",
        price: 349,
        category: "Headphones",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        description: "Industry-leading noise cancellation and immersive high-fidelity audio.",
        isBestSeller: true,
        sku: "AUR-HDP-001",
        stockQuantity: 25,
        lowStockThreshold: 5,
        isActive: true
    },
    {
        id: 2,
        name: "Studio Monitors X1",
        price: 899,
        category: "Speakers",
        image: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        description: "Professional grade studio monitors with flat frequency response.",
        isBestSeller: true,
        sku: "AUR-SPK-001",
        stockQuantity: 8,
        lowStockThreshold: 3,
        isActive: true
    },
    {
        id: 3,
        name: "Bass Boost Earbuds",
        price: 129,
        category: "Headphones",
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        description: "True wireless earbuds featuring intense bass and sweat resistance.",
        isBestSeller: false,
        sku: "AUR-HDP-002",
        stockQuantity: 0,
        lowStockThreshold: 10,
        isActive: true
    },
    {
        id: 4,
        name: "Acoustic Tower Speaker",
        price: 1200,
        category: "Speakers",
        image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        description: "Premium floorstanding speakers with room-filling, clear sound.",
        isBestSeller: true,
        sku: "AUR-SPK-002",
        stockQuantity: 4,
        lowStockThreshold: 5,
        isActive: true
    },
    {
        id: 5,
        name: "Audiophile DAC/Amp",
        price: 450,
        category: "Accessories",
        image: "https://images.unsplash.com/photo-1520170350707-b2da59970118?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        description: "High-resolution digital-to-analog converter for pristine sound.",
        isBestSeller: false,
        sku: "AUR-ACC-001",
        stockQuantity: 15,
        lowStockThreshold: 5,
        isActive: true
    },
    {
        id: 6,
        name: "Vintage Record Player",
        price: 299,
        category: "Accessories",
        image: "https://images.unsplash.com/photo-1603048297172-c92544798d5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        description: "Classic turntable with modern bluetooth output capabilities.",
        isBestSeller: true,
        sku: "AUR-ACC-002",
        stockQuantity: 10,
        lowStockThreshold: 5,
        isActive: false
    }
];

export const categories = [
    {
        id: 'headphones',
        name: 'Headphones',
        image: 'https://images.unsplash.com/photo-1599669500515-9b4b92c58f59?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
        id: 'speakers',
        name: 'Speakers',
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
        id: 'accessories',
        name: 'Accessories',
        image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    }
];

export const testimonials = [
    {
        id: 1,
        name: "Alex Mercer",
        text: "The soundstage on these ANC headphones is unbelievable. Best investment I've made.",
        rating: 5
    },
    {
        id: 2,
        name: "Jordan Lee",
        text: "Incredible customer service. Auralis shipped my studio monitors lightning fast.",
        rating: 5
    },
    {
        id: 3,
        name: "Sam Taylor",
        text: "The DAC completely transformed my listening experience. Highly recommend their gear.",
        rating: 5
    }
];
