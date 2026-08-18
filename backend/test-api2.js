(async () => {
    try {
        const res = await fetch('http://localhost:5000/api/v1/products');
        console.log(res.status, await res.text());
    } catch(e) {
        console.log("Fetch failed:", e);
    }
})();
