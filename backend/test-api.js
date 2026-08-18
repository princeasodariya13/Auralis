(async () => {
    const res1 = await fetch('http://localhost:5000/api/health');
    console.log('HEALTH HTML:', await res1.text());
})();
