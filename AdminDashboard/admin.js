// Africana Swallow — Admin Dashboard JS
const API = 'https://africana-swallow-main.onrender.com/api';
let token = localStorage.getItem('asw-admin-token') || null;
let currentOrderFilter = '';
let currentResFilter = '';
let uploadedImageUrl = ''; // stores the Cloudinary URL after upload

// ── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    if (token) {
        showDashboard();
    }
});

// ── Auth ─────────────────────────────────────────────────────────────────────
async function adminLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = '';

    if (!email || !password) {
        errorEl.textContent = 'Please enter email and password.';
        return;
    }

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
            token = data.token;
            localStorage.setItem('asw-admin-token', token);
            localStorage.setItem('asw-admin-name', data.admin.name);
            showDashboard();
        } else {
            errorEl.textContent = data.message || 'Login failed.';
        }
    } catch (err) {
        errorEl.textContent = 'Could not connect to server.';
    }
}

function adminLogout() {
    token = null;
    localStorage.removeItem('asw-admin-token');
    localStorage.removeItem('asw-admin-name');
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('adminNameDisplay').textContent =
        localStorage.getItem('asw-admin-name') || 'Admin';
    loadStats();
    loadOrders();
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
function showTab(name, btn) {
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${name}`).classList.add('active');
    btn.classList.add('active');

    if (name === 'orders') loadOrders();
    if (name === 'reservations') loadReservations();
    if (name === 'menu') loadMenuAdmin();
}

// ── Stats ─────────────────────────────────────────────────────────────────────
async function loadStats() {
    try {
        const res = await fetch(`${API}/orders/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const s = data.data;
            document.getElementById('statTotal').textContent = s.total;
            document.getElementById('statPending').textContent = s.pending;
            document.getElementById('statPreparing').textContent = s.preparing;
            document.getElementById('statDelivered').textContent = s.delivered;
            document.getElementById('statRevenue').textContent = s.totalRevenue.toLocaleString();
        }
    } catch (err) {
        console.error('Stats error:', err);
    }
}

// ── Orders ────────────────────────────────────────────────────────────────────
async function loadOrders(status = currentOrderFilter) {
    currentOrderFilter = status;
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = `<tr><td colspan="9" class="empty-msg">Loading...</td></tr>`;

    try {
        const url = status ? `${API}/orders?status=${status}` : `${API}/orders`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();

        if (!data.success || data.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="empty-msg">No orders found.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.data.map(order => `
            <tr>
                <td><strong>${order.orderNumber}</strong></td>
                <td>${order.customerName}</td>
                <td>${order.customerPhone}</td>
                <td>${order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</td>
                <td>₦${order.totalAmount.toLocaleString()}</td>
                <td>${order.orderType}</td>
                <td><span class="badge badge-${order.status}">${order.status}</span></td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <select class="action-select" onchange="updateOrderStatus('${order._id}', this.value)">
                        <option value="">Change status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-msg">Error loading orders.</td></tr>`;
    }
}

function filterOrders(status, btn) {
    document.querySelectorAll('#tab-orders .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadOrders(status);
}

async function updateOrderStatus(orderId, status) {
    if (!status) return;
    try {
        const res = await fetch(`${API}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ ${data.message}`);
            loadOrders(currentOrderFilter);
            loadStats();
        } else {
            showToast(`❌ ${data.message}`);
        }
    } catch (err) {
        showToast('Error updating order.');
    }
}

// ── Reservations ──────────────────────────────────────────────────────────────
async function loadReservations(status = currentResFilter) {
    currentResFilter = status;
    const tbody = document.getElementById('reservationsTableBody');
    tbody.innerHTML = `<tr><td colspan="8" class="empty-msg">Loading...</td></tr>`;

    try {
        const url = status ? `${API}/reservations?status=${status}` : `${API}/reservations`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();

        if (!data.success || data.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-msg">No reservations found.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.data.map(r => `
            <tr>
                <td>${r.name}</td>
                <td>${r.email}</td>
                <td>${r.phone}</td>
                <td>${new Date(r.date).toLocaleDateString()}</td>
                <td>${r.time}</td>
                <td>${r.guests}</td>
                <td><span class="badge badge-${r.status}">${r.status}</span></td>
                <td style="display:flex;gap:6px;">
                    ${r.status === 'pending' ? `
                        <button onclick="updateReservation('${r._id}','confirmed')"
                            style="padding:5px 10px;background:#e8f5e9;color:#2c5530;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">
                            Confirm
                        </button>
                        <button onclick="updateReservation('${r._id}','cancelled')"
                            style="padding:5px 10px;background:#ffebee;color:#b71c1c;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">
                            Cancel
                        </button>` : '—'}
                    <button onclick="deleteReservation('${r._id}')"
                        style="padding:5px 8px;background:#f5f5f5;color:#888;border:none;border-radius:6px;cursor:pointer;font-size:12px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-msg">Error loading reservations.</td></tr>`;
    }
}

function filterReservations(status, btn) {
    document.querySelectorAll('#tab-reservations .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadReservations(status);
}

async function updateReservation(id, status) {
    try {
        const res = await fetch(`${API}/reservations/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ ${data.message}`);
            loadReservations(currentResFilter);
        } else {
            showToast(`❌ ${data.message}`);
        }
    } catch (err) {
        showToast('Error updating reservation.');
    }
}

async function deleteReservation(id) {
    if (!confirm('Delete this reservation?')) return;
    try {
        const res = await fetch(`${API}/reservations/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            showToast(`🗑️ ${data.message}`);
            loadReservations(currentResFilter);
        }
    } catch (err) {
        showToast('Error deleting reservation.');
    }
}

// ── Menu ──────────────────────────────────────────────────────────────────────
async function loadMenuAdmin() {
    const grid = document.getElementById('menuAdminGrid');
    grid.innerHTML = '<p class="empty-msg">Loading menu...</p>';

    try {
        const res = await fetch(`${API}/menu/admin`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success || data.data.length === 0) {
            grid.innerHTML = '<p class="empty-msg">No menu items found.</p>';
            return;
        }

        grid.innerHTML = data.data.map(item => `
            <div class="menu-admin-card">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/220x150?text=No+Image'">
                <div class="menu-admin-card-body">
                    <div class="category">${item.category} ${item.popular ? '⭐' : ''}</div>
                    <h4>${item.name}</h4>
                    <div class="price">₦${item.price.toLocaleString()}</div>
                    <span class="badge ${item.available ? 'badge-confirmed' : 'badge-cancelled'}">
                        ${item.available ? 'Available' : 'Unavailable'}
                    </span>
                    <div class="card-actions" style="margin-top:10px;">
                        <button class="btn-toggle ${item.available ? 'btn-unavailable' : 'btn-available'}"
                            onclick="toggleAvailability('${item._id}', ${!item.available})">
                            ${item.available ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                        <button class="btn-delete" onclick="deleteMenuItem('${item._id}', '${item.name}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        grid.innerHTML = '<p class="empty-msg">Error loading menu.</p>';
    }
}

// ── Image Upload to Cloudinary ────────────────────────────────────────────────
async function handleImageUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const preview = document.getElementById('imagePreview');
    const uploadStatus = document.getElementById('uploadStatus');

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
        preview.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary via backend
    uploadStatus.textContent = '⏳ Uploading image...';
    uploadStatus.style.color = '#888';

    const formData = new FormData();
    formData.append('image', file);

    try {
        const res = await fetch(`${API}/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            uploadedImageUrl = data.url;
            uploadStatus.textContent = '✅ Image uploaded successfully!';
            uploadStatus.style.color = '#2c5530';
        } else {
            uploadStatus.textContent = `❌ Upload failed: ${data.message}`;
            uploadStatus.style.color = '#b71c1c';
            uploadedImageUrl = '';
        }
    } catch (err) {
        uploadStatus.textContent = '❌ Upload failed. Check connection.';
        uploadStatus.style.color = '#b71c1c';
        uploadedImageUrl = '';
    }
}

async function addMenuItem() {
    const name = document.getElementById('new-name').value.trim();
    const category = document.getElementById('new-category').value;
    const price = document.getElementById('new-price').value;
    const description = document.getElementById('new-description').value.trim();
    const popular = document.getElementById('new-popular').checked;

    if (!name || !category || !price || !description) {
        showToast('Please fill in all required fields.');
        return;
    }

    if (!uploadedImageUrl) {
        showToast('Please upload an image first.');
        return;
    }

    try {
        const res = await fetch(`${API}/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                name, category,
                price: parseFloat(price),
                image: uploadedImageUrl,
                description, popular
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ "${name}" added to menu.`);
            // Reset form
            document.getElementById('new-name').value = '';
            document.getElementById('new-price').value = '';
            document.getElementById('new-description').value = '';
            document.getElementById('new-category').value = '';
            document.getElementById('new-popular').checked = false;
            document.getElementById('new-image-input').value = '';
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('uploadStatus').textContent = '';
            uploadedImageUrl = '';
            loadMenuAdmin();
        } else {
            showToast(`❌ ${data.message}`);
        }
    } catch (err) {
        showToast('Error adding item.');
    }
}

async function toggleAvailability(id, available) {
    try {
        const res = await fetch(`${API}/menu/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ available })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ "${data.data.name}" marked as ${available ? 'available' : 'unavailable'}.`);
            loadMenuAdmin();
        }
    } catch (err) {
        showToast('Error updating item.');
    }
}

async function deleteMenuItem(id, name) {
    if (!confirm(`Delete "${name}" from the menu? This cannot be undone.`)) return;
    try {
        const res = await fetch(`${API}/menu/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            showToast(`🗑️ ${data.message}`);
            loadMenuAdmin();
        } else {
            showToast(`❌ ${data.message}`);
        }
    } catch (err) {
        showToast('Error deleting item.');
    }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
    const t = document.getElementById('adminToast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 4000);
}

// Allow Enter key on login
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('loginScreen').style.display !== 'none') {
        adminLogin();
    }
});