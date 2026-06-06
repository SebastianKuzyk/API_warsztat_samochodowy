/**
 * Wspólne funkcje + klient REST API.
 *
 * Backend: Laravel 13, prefix /api/v1, sesje (cookie-based).
 */

const API_BASE = 'api/v1';

/**
 * Pobiera token CSRF z meta tagu (Laravel) jeśli jest, albo null.
 * Dla naszego API wszystko idzie pod /api/* gdzie middleware 'web' już
 * obsługuje CSRF tylko dla POST/PUT/DELETE (token musimy wysyłać w nagłówku).
 */
function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : null;
}

/**
 * Pobierz token XSRF z ciasteczka (Laravel ustawia 'XSRF-TOKEN').
 */
function getXsrfFromCookie() {
    const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
}

async function apiFetch(path, { method = 'GET', body = null, params = null } = {}) {
    let url = `${API_BASE}/${path}`;
    if (params && Object.keys(params).length) {
        const qs = new URLSearchParams(
            Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
        );
        url += (url.includes('?') ? '&' : '?') + qs.toString();
    }

    const opts = {
        method,
        credentials: 'include',
        headers: {
            'Accept':           'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    // CSRF — Laravel akceptuje X-XSRF-TOKEN z ciasteczka XSRF-TOKEN
    const xsrf = getXsrfFromCookie();
    if (xsrf && method !== 'GET') {
        opts.headers['X-XSRF-TOKEN'] = xsrf;
    }

    if (body !== null) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }

    const res = await fetch(url, opts);
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : {}; } catch { /* nie-JSON */ }

    if (!res.ok || (json && json.success === false)) {
        const msg = (json && (json.error || json.message)) || `HTTP ${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        err.payload = json;
        throw err;
    }
    return json;
}

const api = {
    // ---------- Auth ----------
    login: (login, password) =>
        apiFetch('auth/login', { method: 'POST', body: { login, password } }),
    clientLogin: (plate, code) =>
        apiFetch('auth/client-login', { method: 'POST', body: { plate, code } }),
    logout: () =>
        apiFetch('auth/logout', { method: 'POST' }),
    checkSession: () =>
        apiFetch('auth/check'),
    updateProfile: (payload) =>
        apiFetch('auth/profile', { method: 'PUT', body: payload }),

    // ---------- Users ----------
    listUsers: (role = null) =>
        apiFetch('users', { params: role ? { role } : null }),
    getUser: (id) =>
        apiFetch(`users/${id}`),
    addUser: (payload) =>
        apiFetch('users', { method: 'POST', body: payload }),
    deleteUser: (id) =>
        apiFetch(`users/${id}`, { method: 'DELETE' }),

    // ---------- Customers ----------
    listCustomers: () =>
        apiFetch('customers'),
    getCustomer: (id) =>
        apiFetch(`customers/${id}`),

    // ---------- Service types ----------
    listServiceTypes: () =>
        apiFetch('service-types'),

    // ---------- Repair orders ----------
    listOrders: (filters = {}) =>
        apiFetch('repair-orders', { params: filters }),
    getOrder: (id) =>
        apiFetch(`repair-orders/${id}`),
    createOrder: (payload) =>
        apiFetch('repair-orders', { method: 'POST', body: payload }),
    deleteOrder: (id) =>
        apiFetch(`repair-orders/${id}`, { method: 'DELETE' }),
    setOrderStatus: (orderId, status) =>
        apiFetch(`repair-orders/${orderId}/status`, { method: 'PUT', body: { status } }),
    updateOrderTasks: (orderId, tasks) =>
        apiFetch(`repair-orders/${orderId}/tasks`, { method: 'PUT', body: { tasks } }),
    editTasks: (orderId, tasks) =>
        apiFetch(`repair-orders/${orderId}/tasks/edit`, { method: 'PUT', body: { tasks } }),
    addTask: (orderId, description, price, serviceTypeId = null) =>
        apiFetch(`repair-orders/${orderId}/tasks`, { method: 'POST',
            body: { description, price, service_type_id: serviceTypeId } }),
    deleteTask: (taskId, orderId) =>
        apiFetch(`repair-orders/${orderId}/tasks/${taskId}`, { method: 'DELETE' }),
    addPartToOrder: (orderId, partId, quantity) =>
        apiFetch(`repair-orders/${orderId}/parts`, { method: 'POST',
            body: { part_id: partId, quantity } }),

    // ---------- Parts ----------
    listParts: (search = '') =>
        apiFetch('parts', { params: search ? { search } : null }),
    addPart: (payload) =>
        apiFetch('parts', { method: 'POST', body: payload }),
    addPartQuantity: (id, quantity) =>
        apiFetch(`parts/${id}/restock`, { method: 'PUT', body: { quantity } }),

    // ---------- Part requests ----------
    listRequests: (filters = {}) =>
        apiFetch('part-requests', { params: filters }),
    createRequest: (payload) =>
        apiFetch('part-requests', { method: 'POST', body: payload }),
    setRequestStatus: (id, status) =>
        apiFetch(`part-requests/${id}`, { method: 'PUT', body: { status } }),
    receiveRequest: (id) =>
        apiFetch(`part-requests/${id}/receive`, { method: 'PUT' }),

    // ---------- Stats ----------
    stats: () => apiFetch('stats'),

    // ---------- Client panel ----------
    clientDashboard: () =>
        apiFetch('client/dashboard'),

    // ---------- Vehicles ----------
    listVehicles: (filters = {}) =>
        apiFetch('vehicles', { params: filters }),
    getVehicle: (id) =>
        apiFetch(`vehicles/${id}`),
    regenerateCode: (id) =>
        apiFetch(`vehicles/${id}/regenerate-code`, { method: 'PUT' }),

    // ---------- Invoices ----------
    listInvoices: () =>
        apiFetch('invoices'),
    getInvoice: (id) =>
        apiFetch(`invoices/${id}`),
    createInvoice: (payload) =>
        apiFetch('invoices', { method: 'POST', body: payload }),
    setInvoicePaid: (id, paid) =>
        apiFetch(`invoices/${id}/paid`, { method: 'PUT', body: { paid } }),
    deleteInvoice: (id) =>
        apiFetch(`invoices/${id}`, { method: 'DELETE' })
};

// ---------- LocalStorage helper ----------
const auth = {
    getUser() {
        try {
            const raw = sessionStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    },
    setUser(user) { sessionStorage.setItem('user', JSON.stringify(user)); },
    clear() { sessionStorage.removeItem('user'); }
};

function checkAuthOrRedirect() {
    const user = auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

async function logout() {
    try { await api.logout(); } catch { /* ignore */ }
    auth.clear();
    window.location.href = 'index.html';
}

function updateClock() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const d = document.getElementById('currentDate');
    const t = document.getElementById('currentTime');
    if (d) d.textContent = `📅 ${dateStr}`;
    if (t) t.textContent = `🕐 ${timeStr}`;
}

function setActiveNav(activeId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const el = document.getElementById(activeId);
    if (el) el.classList.add('active');
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    const s = document.getElementById(sectionId);
    if (s) s.classList.remove('hidden');
}

function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add('active'); }
function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('active'); }

function formatPrice(v) {
    const n = parseFloat(v) || 0;
    return n.toFixed(2) + ' zł';
}

function formatDate(s) {
    if (!s) return 'Brak';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString('pl-PL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function showNotification(message, type = 'info') {
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.textContent = message;
    n.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        padding: 15px 25px;
        background-color: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white; border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000; animation: slideIn 0.3s ease-out;
        max-width: 90vw; white-space: pre-wrap;
    `;
    document.body.appendChild(n);
    setTimeout(() => {
        n.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => n.remove(), 300);
    }, 3500);
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.body.classList.contains('login-page')) return;

    const user = checkAuthOrRedirect();
    if (!user) return;

    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    if (userNameEl) userNameEl.textContent = user.name || user.login || '';
    if (userRoleEl) userRoleEl.textContent = (user.role || '').toUpperCase();

    updateClock();
    setInterval(updateClock, 1000);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });
});

const _notifyStyle = document.createElement('style');
_notifyStyle.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(_notifyStyle);


// =====================================================
// Modal edycji profilu (wstrzykiwany do każdego panelu)
// =====================================================
function openEditProfileModal() {
    const user = auth.getUser();
    if (!user) return;

    const existing = document.getElementById('editProfileOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'editProfileOverlay';
    overlay.className = 'modal active';
    overlay.style.zIndex = 12000;

    overlay.innerHTML = `
        <div class="modal-content" style="max-width:520px;">
            <div class="modal-header">
                <h3><i class="fas fa-user-edit"></i> Aktualizuj dane</h3>
                <span class="modal-close" data-action="cancel">&times;</span>
            </div>
            <div style="padding:0 20px 20px;">
                <p style="color:#7f8c8d;font-size:13px;">Wypełnij tylko pola, które chcesz zmienić.</p>
                <div class="form-group">
                    <label>Login</label>
                    <input type="text" id="profLogin" value="${escapeHtml(user.login || '')}">
                </div>
                <div class="form-group">
                    <label>Telefon (9 cyfr)</label>
                    <input type="tel" id="profPhone" value="${escapeHtml(user.phone || '')}">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="profEmail" value="${escapeHtml(user.email || '')}">
                </div>
                <div class="form-group">
                    <label>Nowe hasło (zostaw puste, by nie zmieniać)</label>
                    <input type="password" id="profNewPass" placeholder="••••••••">
                </div>
                <hr>
                <div class="form-group">
                    <label>Aktualne hasło *</label>
                    <input type="password" id="profCurrentPass" placeholder="potwierdzenie zmian" required>
                </div>
                <div class="btn-group">
                    <button class="btn btn-success" data-action="save">
                        <i class="fas fa-save"></i> Zapisz
                    </button>
                    <button class="btn btn-secondary" data-action="cancel">Anuluj</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', async (e) => {
        const act = e.target.dataset.action;
        if (act === 'cancel' || e.target === overlay) {
            overlay.remove();
            return;
        }
        if (act === 'save') {
            const payload = {
                login:            overlay.querySelector('#profLogin').value.trim(),
                phone:            overlay.querySelector('#profPhone').value.trim(),
                email:            overlay.querySelector('#profEmail').value.trim(),
                new_password:     overlay.querySelector('#profNewPass').value,
                current_password: overlay.querySelector('#profCurrentPass').value
            };
            if (!payload.current_password) {
                showNotification('Aktualne hasło jest wymagane', 'error');
                return;
            }
            if (payload.phone && !/^\d{9}$/.test(payload.phone)) {
                showNotification('Telefon musi mieć 9 cyfr', 'error');
                return;
            }
            try {
                const res = await api.updateProfile(payload);
                if (res.data && res.data.user) {
                    const cur = auth.getUser() || {};
                    auth.setUser({ ...cur, ...res.data.user });
                }
                showNotification('Profil zaktualizowany', 'success');
                overlay.remove();
                if (typeof loadDashboard === 'function') loadDashboard();
            } catch (err) {
                showNotification('Błąd: ' + err.message, 'error');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('login-page')) return;
    const footer = document.querySelector('.sidebar-footer');
    if (!footer) return;
    if (!document.getElementById('editProfileBtn')) {
        const btn = document.createElement('button');
        btn.id = 'editProfileBtn';
        btn.className = 'btn btn-primary btn-block';
        btn.style.marginBottom = '8px';
        btn.innerHTML = '<i class="fas fa-user-edit"></i> Edytuj profil';
        btn.addEventListener('click', openEditProfileModal);
        footer.insertBefore(btn, footer.firstChild);
    }
});

// =====================================================
// Generyczny modal "Szczegóły"
// =====================================================
function showDetailsModal(title, htmlContent) {
    const existing = document.getElementById('genericDetailsOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'genericDetailsOverlay';
    overlay.className = 'modal active';
    overlay.style.zIndex = 11500;

    overlay.innerHTML = `
        <div class="modal-content" style="max-width:760px;">
            <div class="modal-header">
                <h3>${escapeHtml(title)}</h3>
                <span class="modal-close" data-action="close">&times;</span>
            </div>
            <div style="padding:0 20px 20px;">${htmlContent}</div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'close' || e.target === overlay) {
            overlay.remove();
        }
    });
}

function statusBadgeClass(status) {
    switch (status) {
        case 'Gotowe do odbioru': return 'badge-success';
        case 'W trakcie':         return 'badge-warning';
        case 'Nierozpoczęte':     return 'badge-danger';
        case 'Czeka na części':   return 'badge-secondary';
        case 'Odebrane':          return 'badge-info';
        default:                  return 'badge-info';
    }
}

// =====================================================
// Renderowanie faktury / paragonu (wspólne)
// =====================================================
function renderInvoiceFullHtml(inv, opts = {}) {
    const isReceipt = inv.document_type === 'receipt';
    const docTitle  = isReceipt ? 'PARAGON' : 'FAKTURA';
    const showActions = opts.showActions !== false;

    const tasksHtml = (inv.tasks || []).map((t, i) =>
        `<tr>
            <td style="padding:6px;border-bottom:1px solid #ecf0f1;">${i + 1}</td>
            <td style="padding:6px;border-bottom:1px solid #ecf0f1;">${escapeHtml(t.description)}</td>
            <td style="padding:6px;border-bottom:1px solid #ecf0f1;text-align:right;">1 szt.</td>
            <td style="padding:6px;border-bottom:1px solid #ecf0f1;text-align:right;">${formatPrice(t.price)}</td>
            <td style="padding:6px;border-bottom:1px solid #ecf0f1;text-align:right;">${formatPrice(t.price)}</td>
        </tr>`
    ).join('');
    const partsHtml = (inv.parts || []).map((p, i) =>
        `<tr>
            <td style="padding:6px;border-bottom:1px solid #ecf0f1;">${(inv.tasks?.length || 0) + i + 1}</td>
            <td style="padding:6px;border-bottom:1px solid #ecf0f1;">${escapeHtml(p.name || 'Część zamienna')}</td>
            <td style="padding:6px;border-bottom:1px solid #ecf0f1;text-align:right;">${p.quantity} szt.</td>
            <td style="padding:6px;border-bottom:1px solid #ecf0f1;text-align:right;">${formatPrice(p.part_price)}</td>
            <td style="padding:6px;border-bottom:1px solid #ecf0f1;text-align:right;">${formatPrice(p.line_total)}</td>
        </tr>`
    ).join('');

    const buyerLines = [
        inv.buyer_name,
        [inv.buyer_postcode, inv.buyer_city].filter(Boolean).join(' '),
        inv.buyer_address,
        inv.buyer_nip ? `NIP: ${inv.buyer_nip}` : ''
    ].filter(Boolean).map(l => escapeHtml(l)).join('<br>');

    const sellerLines = [
        inv.seller_name || 'Warsztat Samochodowy',
        inv.seller_address,
        inv.seller_nip ? `NIP: ${inv.seller_nip}` : ''
    ].filter(Boolean).map(l => escapeHtml(l)).join('<br>');

    const dueDate = inv.due_date ? formatDate(inv.due_date).split(',')[0] : '—';

    const actionsHtml = showActions ? `
        <div class="btn-group" style="margin-top:15px;">
            <button class="btn btn-primary" onclick="window.print()">
                <i class="fas fa-print"></i> Drukuj ${isReceipt ? 'paragon' : 'fakturę'}
            </button>
            ${(!inv.paid && opts.canMarkPaid) ? `<button class="btn btn-success" onclick="markInvoicePaid(${inv.id})">
                <i class="fas fa-check"></i> Oznacz jako opłaconą
            </button>` : ''}
        </div>
    ` : '';

    return `
        <div class="invoice-print" style="font-family:Arial,sans-serif;color:#000;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:25px;">
                <div>
                    <h1 style="margin:0;font-size:28px;">${docTitle}</h1>
                    <p style="margin:4px 0;font-size:18px;"><strong>${escapeHtml(inv.invoice_number)}</strong></p>
                </div>
                <div style="text-align:right;font-size:13px;">
                    <p style="margin:0;"><strong>Data wystawienia:</strong> ${formatDate(inv.issued_at).split(',')[0]}</p>
                    ${!isReceipt ? `<p style="margin:4px 0;"><strong>Termin płatności:</strong> ${dueDate}</p>` : ''}
                    <p style="margin:0;"><strong>Sposób zapłaty:</strong> ${escapeHtml(inv.payment_method || 'Gotówka')}</p>
                </div>
            </div>

            ${isReceipt ? `
                <div style="border:1px solid #ddd;padding:12px;border-radius:4px;margin-bottom:20px;">
                    <strong style="font-size:12px;color:#7f8c8d;">SPRZEDAWCA</strong><br>
                    ${sellerLines || '—'}
                </div>
            ` : `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:25px;">
                    <div style="border:1px solid #ddd;padding:12px;border-radius:4px;">
                        <strong style="font-size:12px;color:#7f8c8d;">SPRZEDAWCA</strong><br>
                        ${sellerLines || '—'}
                    </div>
                    <div style="border:1px solid #ddd;padding:12px;border-radius:4px;">
                        <strong style="font-size:12px;color:#7f8c8d;">NABYWCA</strong><br>
                        ${buyerLines || '—'}
                    </div>
                </div>
            `}

            <div style="font-size:13px;margin-bottom:10px;">
                <strong>Pojazd:</strong> ${escapeHtml(inv.make || '')} ${escapeHtml(inv.model || '')}
                ${inv.year ? `(${inv.year})` : ''} —
                rejestracja <strong>${escapeHtml(inv.license_plate || '')}</strong>
                ${inv.vin ? ` | VIN: ${escapeHtml(inv.vin)}` : ''}
            </div>

            <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:13px;">
                <thead>
                    <tr style="background:#34495e;color:white;">
                        <th style="padding:8px;text-align:left;width:40px;">Lp.</th>
                        <th style="padding:8px;text-align:left;">Nazwa usługi/towaru</th>
                        <th style="padding:8px;text-align:right;width:80px;">Ilość</th>
                        <th style="padding:8px;text-align:right;width:110px;">Cena jedn.</th>
                        <th style="padding:8px;text-align:right;width:110px;">Wartość</th>
                    </tr>
                </thead>
                <tbody>${tasksHtml}${partsHtml}</tbody>
                <tfoot>
                    <tr><td colspan="4" style="padding:6px;text-align:right;">Suma usług:</td>
                        <td style="padding:6px;text-align:right;">${formatPrice(inv.tasks_total)}</td></tr>
                    <tr><td colspan="4" style="padding:6px;text-align:right;">Suma części:</td>
                        <td style="padding:6px;text-align:right;">${formatPrice(inv.parts_total)}</td></tr>
                    <tr style="background:#ecf0f1;font-size:18px;">
                        <td colspan="4" style="padding:12px;text-align:right;"><strong>DO ZAPŁATY:</strong></td>
                        <td style="padding:12px;text-align:right;"><strong>${formatPrice(inv.total)}</strong></td>
                    </tr>
                </tfoot>
            </table>

            ${inv.notes ? `<p style="margin-top:15px;"><strong>Uwagi:</strong> ${escapeHtml(inv.notes)}</p>` : ''}
            <p style="margin-top:25px;text-align:center;font-size:16px;">
                Status: ${inv.paid
                    ? '<span class="badge badge-success">OPŁACONA</span>'
                    : '<span class="badge badge-warning">DO ZAPŁATY</span>'}
            </p>
        </div>
        ${actionsHtml}
    `;
}
