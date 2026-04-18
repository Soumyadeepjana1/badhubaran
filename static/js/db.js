// api.js - Talks to Flask Backend

let cachedProducts = [];

async function initDB() {
    try {
        const response = await fetch('/api/products');
        cachedProducts = await response.json();
    } catch (e) {
        console.error("Error fetching products API:", e);
    }
}

function getAllProducts() {
    return cachedProducts;
}

function getProductById(id) {
    if (!id) return null;
    return cachedProducts.find(p => p.id === parseInt(id)) || null;
}

// Ensure global availability
window.DB = {
    initDB,
    getAllProducts,
    getProductById
};
