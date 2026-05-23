// Africana Swallow Restaurant JavaScript
// Connected to real backend API

const API_BASE = 'https://africana-swallow-main.onrender.com/api';

class AfricanaSwallow {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('africana-cart')) || [];
        this.menuItems = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadMenuFromAPI();   // ← now loads from real database
        this.updateCartUI();
        this.setupSmoothScrolling();
    }

    // ── Load menu from backend ───────────────────────────────────────────
    async loadMenuFromAPI() {
        try {
            const res = await fetch(`${API_BASE}/menu`);
            const data = await res.json();

            if (data.success) {
                // Map MongoDB _id to id so existing cart logic still works
                this.menuItems = data.data.map(item => ({
                    ...item,
                    id: item._id
                }));
                this.renderMenu();
            } else {
                console.error('Failed to load menu:', data.message);
                this.showToast('Could not load menu. Please refresh.');
            }
        } catch (error) {
            console.error('Menu fetch error:', error);
            this.showToast('Could not connect to server. Please try again.');
        }
    }

    setupEventListeners() {
        document.getElementById('cartBtn').addEventListener('click', () => this.toggleCart());
        document.getElementById('closeCart').addEventListener('click', () => this.toggleCart());
        document.getElementById('clearCart').addEventListener('click', () => this.clearCart());
        document.getElementById('checkoutBtn').addEventListener('click', () => this.showCheckoutForm());

        // Menu category filtering
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterMenu(e.target.dataset.category);
            });
        });

        // Reservation form
        document.getElementById('reservationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleReservation();
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }

    // ── Menu rendering ───────────────────────────────────────────────────
    renderMenu(items = this.menuItems) {
        const menuGrid = document.getElementById('menuGrid');
        menuGrid.innerHTML = '';

        if (items.length === 0) {
            menuGrid.innerHTML = `<p style="text-align:center;color:#888;padding:2rem;">No items found.</p>`;
            return;
        }

        items.forEach(item => {
            menuGrid.appendChild(this.createMenuCard(item));
        });
    }

    createMenuCard(item) {
        const card = document.createElement('div');
        card.className = 'menu-item';
        card.innerHTML = `
            <div class="menu-item-image">
                <img class="IMG" src="${item.image}" alt="${item.name}" style="width:100%;height:200px;object-fit:cover;">
                ${item.popular ? '<div class="popular-badge">Popular</div>' : ''}
            </div>
            <div class="menu-item-info">
                <div class="menu-item-category">${item.category}</div>
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-description">${item.description}</div>
                <div class="menu-item-footer">
                    <div class="menu-item-price">₦${item.price.toLocaleString()}</div>
                    <button class="add-to-cart" onclick="restaurant.addToCart('${item.id}')">
                        <i class="fas fa-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
        return card;
    }

    filterMenu(category) {
        if (category === 'all') {
            this.renderMenu();
        } else {
            const filtered = this.menuItems.filter(item => item.category === category);
            this.renderMenu(filtered);
        }
    }

    // ── Cart logic ───────────────────────────────────────────────────────
    addToCart(itemId) {
        const item = this.menuItems.find(i => i.id === itemId);
        if (!item) return;

        const existing = this.cart.find(c => c.id === itemId);
        if (existing) {
            existing.quantity += 1;
        } else {
            this.cart.push({ ...item, quantity: 1 });
        }

        this.saveCart();
        this.updateCartUI();
        this.showToast(`${item.name} added to cart!`);
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartUI();
        this.renderCartItems();
    }

    updateQuantity(itemId, change) {
        const item = this.cart.find(i => i.id === itemId);
        if (!item) return;
        item.quantity += change;
        if (item.quantity <= 0) {
            this.removeFromCart(itemId);
        } else {
            this.saveCart();
            this.updateCartUI();
            this.renderCartItems();
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartUI();
        this.renderCartItems();
        this.showToast('Cart cleared!');
    }

    updateCartUI() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cartCount').textContent = totalItems;

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('cartTotal').textContent = total.toLocaleString();
    }

    toggleCart() {
        const cartModal = document.getElementById('cartModal');
        cartModal.classList.toggle('show');
        if (cartModal.classList.contains('show')) {
            this.renderCartItems();
        }
    }

    renderCartItems() {
        const cartItems = document.getElementById('cartItems');

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div style="text-align:center;padding:2rem;color:#666;">
                    <i class="fas fa-shopping-cart" style="font-size:3rem;margin-bottom:1rem;color:#ccc;"></i>
                    <p>Your cart is empty</p>
                    <p style="font-size:0.9rem;margin-top:0.5rem;">Add some delicious African dishes!</p>
                </div>`;
            return;
        }

        cartItems.innerHTML = '';
        this.cart.forEach(item => {
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}" style="width:50px;height:60px;object-fit:cover;border-radius:50%;">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₦${item.price.toLocaleString()}</div>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="restaurant.updateQuantity('${item.id}', -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span style="margin:0 0.5rem;font-weight:600;">${item.quantity}</span>
                    <button class="quantity-btn" onclick="restaurant.updateQuantity('${item.id}', 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <button class="quantity-btn" onclick="restaurant.removeFromCart('${item.id}')" style="color:#ff6b35;">
                    <i class="fas fa-trash"></i>
                </button>`;
            cartItems.appendChild(el);
        });
    }

    // ── Checkout form (collects customer info before placing order) ──────
    showCheckoutForm() {
        if (this.cart.length === 0) {
            this.showToast('Your cart is empty!');
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Inject a checkout form into the cart modal footer
        const cartFooter = document.querySelector('.cart-footer');
        cartFooter.innerHTML = `
            <div style="padding:1rem;">
                <h4 style="margin-bottom:1rem;color:#2c5530;">Your Details</h4>
                <input id="co-name" type="text" placeholder="Full Name *" required
                    style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
                <input id="co-phone" type="tel" placeholder="Phone Number *" required
                    style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
                <input id="co-email" type="email" placeholder="Email (optional)"
                    style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
                <select id="co-type" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                    <option value="dine-in">Dine-in</option>
                </select>
                <input id="co-address" type="text" placeholder="Delivery Address (if delivery)"
                    style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
                <textarea id="co-notes" placeholder="Special requests / notes"
                    style="width:100%;padding:8px;margin-bottom:12px;border:1px solid #ddd;border-radius:6px;resize:vertical;"></textarea>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong>Total: ₦${total.toLocaleString()}</strong>
                    <div style="display:flex;gap:8px;">
                        <button onclick="restaurant.resetCartFooter()"
                            style="padding:8px 16px;background:#ccc;border:none;border-radius:6px;cursor:pointer;">
                            Back
                        </button>
                        <button onclick="restaurant.submitOrder()"
                            style="padding:8px 16px;background:#2c5530;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700;">
                            Confirm Order
                        </button>
                    </div>
                </div>
            </div>`;
    }

    resetCartFooter() {
        const cartFooter = document.querySelector('.cart-footer');
        cartFooter.innerHTML = `
            <div class="cart-total">
                <strong>Total: ₦<span id="cartTotal">0</span></strong>
            </div>
            <div class="cart-actions">
                <button class="btn btn-secondary" id="clearCart">Clear Cart</button>
                <button class="btn btn-primary" id="checkoutBtn">Place Order</button>
            </div>`;
        document.getElementById('clearCart').addEventListener('click', () => this.clearCart());
        document.getElementById('checkoutBtn').addEventListener('click', () => this.showCheckoutForm());
        this.updateCartUI();
    }

    // ── REAL checkout — sends order to backend ───────────────────────────
    async submitOrder() {
        const name = document.getElementById('co-name')?.value?.trim();
        const phone = document.getElementById('co-phone')?.value?.trim();
        const email = document.getElementById('co-email')?.value?.trim();
        const orderType = document.getElementById('co-type')?.value;
        const address = document.getElementById('co-address')?.value?.trim();
        const notes = document.getElementById('co-notes')?.value?.trim();

        if (!name || !phone) {
            this.showToast('Please enter your name and phone number.');
            return;
        }

        // Build payload — use MongoDB _id as menuItemId
        const payload = {
            customerName: name,
            customerPhone: phone,
            customerEmail: email,
            orderType,
            deliveryAddress: address,
            notes,
            items: this.cart.map(item => ({
                menuItemId: item.id,
                quantity: item.quantity
            }))
        };

        this.showToast('Placing your order...');

        try {
            const res = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                this.cart = [];
                this.saveCart();
                this.toggleCart();
                this.resetCartFooter();
                this.showToast(`✅ ${data.message}`);
                // Show order number in a clear alert
                setTimeout(() => {
                    alert(`🎉 Order Confirmed!\n\nOrder Number: ${data.data.orderNumber}\nTotal: ₦${data.data.totalAmount.toLocaleString()}\nEstimated time: ${data.data.estimatedTime}\n\nWe'll call you shortly!`);
                }, 500);
            } else {
                this.showToast(`❌ ${data.message}`);
            }

        } catch (error) {
            console.error('Order error:', error);
            this.showToast('Could not place order. Please check your connection.');
        }
    }

    // ── REAL reservation — sends to backend ─────────────────────────────
    async handleReservation() {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const guests = document.getElementById('guests').value;

        if (!name || !email || !phone || !date || !time || !guests) {
            this.showToast('Please fill in all fields.');
            return;
        }

        this.showToast('Processing your reservation...');

        try {
            const res = await fetch(`${API_BASE}/reservations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, date, time, guests: parseInt(guests) })
            });

            const data = await res.json();

            if (data.success) {
                document.getElementById('reservationForm').reset();
                this.showToast(`✅ ${data.message}`);
            } else {
                this.showToast(`❌ ${data.message}`);
            }

        } catch (error) {
            console.error('Reservation error:', error);
            this.showToast('Could not submit reservation. Please try again.');
        }
    }

    // ── Utilities ────────────────────────────────────────────────────────
    saveCart() {
        localStorage.setItem('africana-cart', JSON.stringify(this.cart));
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('show'));
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        const headerHeight = document.querySelector('.header').offsetHeight;
        window.scrollTo({
            top: section.offsetTop - headerHeight - 20,
            behavior: 'smooth'
        });
    }

    setupSmoothScrolling() {
        window.addEventListener('scroll', () => {
            const sections = ['home', 'featured', 'menu', 'about', 'contact'];
            const headerHeight = document.querySelector('.header').offsetHeight;
            let current = '';

            sections.forEach(id => {
                const section = document.getElementById(id);
                if (section) {
                    const top = section.offsetTop - headerHeight - 100;
                    if (window.scrollY >= top && window.scrollY < top + section.offsetHeight) {
                        current = id;
                    }
                }
            });

            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }
}

// Global function used by hero buttons
function scrollToSection(sectionId) {
    restaurant.scrollToSection(sectionId);
}

// ── DOM Ready ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Set minimum date for reservations
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
    }

    // Hamburger menu
    const ham = document.getElementById('ham');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('#nav-menu a');

    if (ham && navMenu) {
        ham.addEventListener('click', () => navMenu.classList.toggle('open'));
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => navMenu.classList.remove('open'));
    });

    // Popular badge styles
    const style = document.createElement('style');
    style.textContent = `
        .popular-badge {
            position: absolute; top: 10px; right: 10px;
            background: #ffd700; color: #2c5530;
            padding: 0.25rem 0.75rem; border-radius: 15px;
            font-size: 0.75rem; font-weight: bold;
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .menu-item-image { position: relative; }
    `;
    document.head.appendChild(style);

    // Boot the app
    window.restaurant = new AfricanaSwallow();
});