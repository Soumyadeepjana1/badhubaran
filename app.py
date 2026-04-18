import os
from flask import Flask, request, jsonify, render_template, send_from_directory, redirect, url_for
import sqlite3
import werkzeug
from werkzeug.utils import secure_filename

app = Flask(__name__)

DB_NAME = 'database.db'
UPLOAD_FOLDER = os.path.join('static', 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        )
    ''')
    c.execute('''
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
        )
    ''')
    
    # Check if empty
    c.execute('SELECT COUNT(*) as cnt FROM products')
    if c.fetchone()['cnt'] == 0:
        products = [
            ("ঐতিহ্যবাহী শাখা ও পলা", "Traditional Shankha & Pola", "Shankha & Pola", 799, 1200, "10", "/static/images/product_shankha.png", "1", "1", "বাঙালি কনের হাতের শোভা বৃদ্ধি করতে খাঁটি শাখা পলা।", "Authentic Shankha Pola to enhance a Bengali bride.", "শাঁখা বাঙালি বিবাহের অপরিহার্য অঙ্গ। এটি পবিত্রতা এবং দীর্ঘায়ুর প্রতীক।"),
            ("কনের শোলার মুকুট ও বরের টোপর", "Bride Mukut & Groom Topor", "Decoration", 1499, 2000, "10", "/static/images/product_topor.png", "1", "0", "নিখুঁত কারুকাজ করা শোলার তৈরী মুকুট ও টোপর।", "Perfectly handcrafted shola mukut and topor.", "টোপর এবং মুকুট বিবাহের সময়ে শুভ শক্তির প্রতীক হিসেবে ব্যবহৃত হয়।"),
            ("খাঁটি সিঁদুর", "Pure Sindoor", "Sindoor & Jewelry", 250, 350, "10", "/static/images/product_sindoor.png", "1", "0", "বিবাহের জন্য সম্পূর্ণ খাঁটি ও উজ্জ্বল সিঁদুর।", "100% pure and bright vermilion for wedding.", "সিঁদুর দান হিন্দু বিবাহের অন্যতম পবিত্র আচার।")
        ]
        c.executemany('INSERT INTO products (name_bn, name_en, category, price, mrp, stock, image_url, is_featured, is_sale, description_bn, description_en, cultural_significance) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', products)
        c.execute('INSERT INTO users (username, password, role) VALUES (?,?,?)', ('admin', 'badhubaran@admin', 'admin'))
        conn.commit()

    conn.close()

init_db()

# ===============================
# Frontend HTML Routes (Views)
# ===============================
@app.route('/')
def index(): return render_template('index.html')
@app.route('/products.html')
def products(): return render_template('products.html')
@app.route('/product.html')
def product(): return render_template('product.html')
@app.route('/cart.html')
def cart(): return render_template('cart.html')
@app.route('/wishlist.html')
def wishlist(): return render_template('wishlist.html')

@app.route('/admin/login.html')
def admin_login(): return render_template('admin/login.html')
@app.route('/admin/index.html')
def admin_dashboard(): return render_template('admin/index.html')
@app.route('/admin/products.html')
def admin_products(): return render_template('admin/products.html')

# ===============================
# API Routes
# ===============================
@app.route('/api/products', methods=['GET'])
def api_get_products():
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM products')
    rows = c.fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in rows])

@app.route('/api/products', methods=['POST'])
def api_create_product():
    conn = get_db()
    c = conn.cursor()
    
    name_bn = request.form.get('name_bn')
    name_en = request.form.get('name_en')
    category = request.form.get('category')
    price = request.form.get('price')
    mrp = request.form.get('mrp')
    stock = request.form.get('stock', 10)
    is_featured = 1 if request.form.get('is_featured') == 'true' else 0
    is_sale = 1 if request.form.get('is_sale') == 'true' else 0
    
    # Handle Image Upload
    image_url = '/static/images/product_sindoor.png' # default
    file = request.files.get('image')
    if file and file.filename != '':
        filename = werkzeug.utils.secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        image_url = f"/static/uploads/{filename}"

    c.execute('''INSERT INTO products (name_bn, name_en, category, price, mrp, stock, image_url, is_featured, is_sale)
                 VALUES (?,?,?,?,?,?,?,?,?)''', 
                 (name_bn, name_en, category, price, mrp, stock, image_url, is_featured, is_sale))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/products/<int:id>', methods=['PUT'])
def api_update_product(id):
    conn = get_db()
    c = conn.cursor()
    
    name_bn = request.form.get('name_bn')
    name_en = request.form.get('name_en')
    category = request.form.get('category')
    price = request.form.get('price')
    mrp = request.form.get('mrp')
    stock = request.form.get('stock')
    is_featured = 1 if request.form.get('is_featured') == 'true' else 0
    is_sale = 1 if request.form.get('is_sale') == 'true' else 0
    
    # Get current image as fallback
    c.execute('SELECT image_url FROM products WHERE id=?', (id,))
    row = c.fetchone()
    image_url = row['image_url'] if row else ''

    file = request.files.get('image')
    if file and file.filename != '':
        filename = werkzeug.utils.secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        image_url = f"/static/uploads/{filename}"

    c.execute('''UPDATE products SET name_bn=?, name_en=?, category=?, price=?, mrp=?, stock=?, image_url=?, is_featured=?, is_sale=? WHERE id=?''', 
                 (name_bn, name_en, category, price, mrp, stock, image_url, is_featured, is_sale, id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/products/<int:id>', methods=['DELETE'])
def api_delete_product(id):
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM products WHERE id=?', (id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
