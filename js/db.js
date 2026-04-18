// db.js - Handles SQLite initialization and local storage persistence

const DB_STORE_KEY = 'badhubaran_db';
let dbInstance = null;

async function initDB() {
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm`
        });

        const savedDb = localStorage.getItem(DB_STORE_KEY);
        if (savedDb) {
            // Load existing DB
            let binaryArray;
            if (savedDb.includes(',')) {
                binaryArray = new Uint8Array(savedDb.split(',').map(Number));
            } else {
                const binary_string = window.atob(savedDb);
                const len = binary_string.length;
                binaryArray = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    binaryArray[i] = binary_string.charCodeAt(i);
                }
            }
            dbInstance = new SQL.Database(binaryArray);
            console.log("Database loaded from local storage.");
        } else {
            // Create fresh DB
            dbInstance = new SQL.Database();
            setupSchema(dbInstance);
            seedData(dbInstance);
            saveDB();
            console.log("New database created and seeded.");
        }
        return dbInstance;
    } catch (e) {
        console.error("Error initializing Database:", e);
        throw e;
    }
}

function saveDB() {
    if (!dbInstance) return;
    try {
        const binaryArray = dbInstance.export();
        let binary = '';
        for (let i = 0; i < binaryArray.byteLength; i++) {
            binary += String.fromCharCode(binaryArray[i]);
        }
        localStorage.setItem(DB_STORE_KEY, window.btoa(binary));
    } catch (e) {
        console.error("Local Storage Save Error:", e);
        alert('Storage Limit Reached. Cannot add more items.');
    }
}

function setupSchema(db) {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name_bn TEXT NOT NULL,
            name_en TEXT NOT NULL,
            category TEXT,
            price REAL,
            mrp REAL,
            stock INTEGER DEFAULT 10,
            description_bn TEXT,
            description_en TEXT,
            image_url TEXT,
            is_featured BOOLEAN DEFAULT 0,
            is_sale BOOLEAN DEFAULT 0,
            cultural_significance TEXT
        );
    `);
}

function seedData(db) {
    // Admin User
    db.run(`INSERT INTO users (username, password, role) VALUES ('admin', 'badhubaran@admin', 'admin')`);

    // Products
    const products = [
        {
            bn: 'ঐতিহ্যবাহী শাখা ও পলা', en: 'Traditional Shankha & Pola', cat: 'Shankha & Pola',
            price: 799, mrp: 1200, img: 'assets/images/product_shankha.png',
            desc_bn: 'বাঙালি কনের হাতের শোভা বৃদ্ধি করতে খাঁটি শাখা পলা।', desc_en: 'Authentic Shankha Pola to enhance a Bengali bride.',
            sig: 'শাঁখা বাঙালি বিবাহের অপরিহার্য অঙ্গ। এটি পবিত্রতা এবং দীর্ঘায়ুর প্রতীক।', feat: 1, sale: 1
        },
        {
            bn: 'কনের শোলার মুকুট ও বরের টোপর', en: 'Bride Mukut & Groom Topor', cat: 'Decoration',
            price: 1499, mrp: 2000, img: 'assets/images/product_topor.png',
            desc_bn: 'নিখুঁত কারুকাজ করা শোলার তৈরী মুকুট ও টোপর।', desc_en: 'Perfectly handcrafted shola mukut and topor.',
            sig: 'টোপর এবং মুকুট বিবাহের সময়ে শুভ শক্তির প্রতীক হিসেবে ব্যবহৃত হয়।', feat: 1, sale: 0
        },
        {
            bn: 'খাঁটি সিঁদুর', en: 'Pure Sindoor', cat: 'Sindoor & Jewelry',
            price: 250, mrp: 350, img: 'assets/images/product_sindoor.png',
            desc_bn: 'বিবাহের জন্য সম্পূর্ণ খাঁটি ও উজ্জ্বল সিঁদুর।', desc_en: '100% pure and bright vermilion for wedding.',
            sig: 'সিঁদুর দান হিন্দু বিবাহের অন্যতম পবিত্র আচার।', feat: 1, sale: 0
        }
    ];

    const stmt = db.prepare(`INSERT INTO products (name_bn, name_en, category, price, mrp, image_url, description_bn, description_en, cultural_significance, is_featured, is_sale) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    products.forEach(p => {
        stmt.run([p.bn, p.en, p.cat, p.price, p.mrp, p.img, p.desc_bn, p.desc_en, p.sig, p.feat ? 1 : 0, p.sale ? 1 : 0]);
    });
    stmt.free();
}

function getAllProducts() {
    if (!dbInstance) return [];
    const res = dbInstance.exec("SELECT * FROM products");
    if (res.length === 0) return [];
    
    // Transform sql.js format to array of objects
    const columns = res[0].columns;
    const values = res[0].values;
    return values.map(valArr => {
        let obj = {};
        columns.forEach((col, idx) => {
            obj[col] = valArr[idx];
        });
        return obj;
    });
}

function getProductById(id) {
    if (!dbInstance) return null;
    const stmt = dbInstance.prepare("SELECT * FROM products WHERE id = :id");
    const result = stmt.getAsObject({':id' : id});
    stmt.free();
    return Object.keys(result).length > 0 ? result : null;
}

// Ensure global availability
window.DB = {
    initDB,
    getAllProducts,
    getProductById,
    saveDB
};
