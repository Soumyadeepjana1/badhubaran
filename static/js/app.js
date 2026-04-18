// app.js - Application State and UI Logic

const State = {
    cart: JSON.parse(localStorage.getItem('cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('wishlist') || '[]'),
    user: JSON.parse(localStorage.getItem('user') || 'null')
};

function saveState() {
    localStorage.setItem('cart', JSON.stringify(State.cart));
    localStorage.setItem('wishlist', JSON.stringify(State.wishlist));
    localStorage.setItem('user', JSON.stringify(State.user));
    updateBadges();
}

function updateBadges() {
    const cartBadge = document.getElementById('cart-badge');
    if (cartBadge) {
        let count = State.cart.reduce((sum, item) => sum + item.qty, 0);
        cartBadge.innerText = count;
        cartBadge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function addToCart(product, qty = 1) {
    if (!State.user) {
        showToast('অনুগ্রহ করে লগইন করুন (Please login to add to cart)');
        openLoginModal();
        return;
    }
    const existing = State.cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty += qty;
    } else {
        State.cart.push({ ...product, qty });
    }
    saveState();
    showToast(`${product.name_bn} কার্টে যোগ করা হয়েছে`);
}

function toggleWishlist(product) {
    if (!State.user) {
        showToast('অনুগ্রহ করে লগইন করুন (Please login to add to wishlist)');
        openLoginModal();
        return;
    }
    const idx = State.wishlist.findIndex(item => item.id === product.id);
    if (idx >= 0) {
        State.wishlist.splice(idx, 1);
        showToast(`${product.name_bn} উইশলিস্ট থেকে সরানো হয়েছে`);
    } else {
        State.wishlist.push(product);
        showToast(`${product.name_bn} উইশলিস্টে যোগ করা হয়েছে`);
    }
    saveState();
}

function isInWishlist(id) {
    return State.wishlist.some(item => item.id === id);
}

// Toast System
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        if(toast.parentElement) toast.remove();
    }, 3000);
}

// Modal Logic
function openLoginModal() {
    document.getElementById('login-modal').classList.add('active');
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    // Mocking successful login for guest user
    State.user = { id: 1, email: email, name: 'Guest' };
    saveState();
    closeModals();
    showToast('লগইন সফল হয়েছে (Login Successful)');
    renderUserNav();
}

function renderUserNav() {
    const userMenu = document.getElementById('user-menu');
    if (!userMenu) return;

    if (State.user) {
        userMenu.innerHTML = `<span style="font-size: 14px; cursor: pointer;" onclick="logout()">লগআউট (Logout)</span>`;
    } else {
        userMenu.innerHTML = `<span style="font-size: 14px; cursor: pointer;" onclick="openLoginModal()">লগইন (Login)</span>`;
    }
}

function logout() {
    State.user = null;
    saveState();
    showToast('লগআউট সফল (Logged Out)');
    renderUserNav();
    if (window.location.pathname.includes('cart') || window.location.pathname.includes('wishlist')) {
        window.location.href = 'index.html';
    }
}

// Global Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateBadges();
    renderUserNav();

    // Close modals on clicking outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) closeModals();
        });
    });
    
    // Auth form override
    const loginForm = document.getElementById('login-form');
    if(loginForm) loginForm.addEventListener('submit', handleLogin);
});

window.App = {
    addToCart,
    toggleWishlist,
    isInWishlist,
    State
};
