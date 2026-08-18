(async () => {
    try {
        const res = await fetch('http://localhost:5001/api/health');
        console.log("5001 HEALTH:", res.status, await res.text());
        
        const res2 = await fetch('http://localhost:5001/api/v1/products');
        console.log("5001 PRODUCTS:", res2.status, await res2.text());
    } catch(e) {
        console.log("Fetch failed:", e);
    }
})();
