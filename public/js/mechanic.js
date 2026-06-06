/**
 * Panel mechanika — pełne podpięcie do api/*.php.
 *
 * Funkcje:
 *  - lista moich zleceń (z filtrowaniem statusu),
 *  - modal ze szczegółami zlecenia (checkboxy "wykonane", "brakuje części"),
 *  - zgłaszanie brakujących części (z magazynu lub do zamówienia),
 *  - dodawanie części z magazynu do zlecenia,
 *  - lista moich zgłoszeń.
 */

let currentOrder = null;     // aktualnie otwarty w modalu
let currentParts = [];       // cache magazynu (do dialogów wyboru)

// ---------- Nawigacja ----------
function showDashboard() {
    showSection('dashboardSection');
    setActiveNav('navDashboard');
    document.getElementById('pageTitle').textContent = 'Dashboard';
    loadDashboard();
}
function showCars() {
    showSection('carsSection');
    setActiveNav('navCars');
    document.getElementById('pageTitle').textContent = 'Moje zlecenia';
    loadCars();
}
function showRequests() {
    showSection('requestsSection');
    setActiveNav('navRequests');
    document.getElementById('pageTitle').textContent = 'Moje zgłoszenia';
    loadRequests();
}

// ---------- Dashboard ----------
async function loadDashboard() {
    const user = auth.getUser();
    if (user) {
        document.getElementById('profileName').textContent = `Witaj, ${user.first_name || user.login}!`;
        document.getElementById('profileFullName').textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        document.getElementById('profilePhone').textContent = user.phone || 'Brak';
        document.getElementById('profileEmail').textContent = user.email || 'Brak';
    }
    try {
        const res = await api.stats();
        const s = res.data;
        document.getElementById('statNotStarted').textContent = s.notStarted ?? 0;
        document.getElementById('statInProgress').textContent = s.inProgress ?? 0;
        document.getElementById('statReady').textContent = s.ready ?? 0;
    } catch (err) {
        showNotification('Błąd statystyk: ' + err.message, 'error');
    }
}

// ---------- Lista zleceń mechanika ----------
async function loadCars() {
    const user = auth.getUser();
    if (!user) return;

    const statusFilter = document.getElementById('statusFilter').value;
    const tbody = document.getElementById('carsTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Ładowanie…</td></tr>';

    try {
        const filters = { mechanic_id: user.id };
        if (statusFilter && statusFilter !== 'Wszystkie') filters.status = statusFilter;

        const res = await api.listOrders(filters);
        const orders = res.data || [];
        if (!orders.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Brak zleceń</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(o => {
            const tasks = o.tasks || [];
            const completed = tasks.filter(t => t.is_completed).length;
            const client = `${o.customer_first_name || ''} ${o.customer_last_name || ''}`.trim();
            return `
                <tr>
                    <td>${escapeHtml(o.make || '')}</td>
                    <td>${escapeHtml(o.model || '')}</td>
                    <td>${escapeHtml(o.license_plate || '')}</td>
                    <td>${escapeHtml(client)}</td>
                    <td><span class="badge ${statusBadgeClass(o.status)}">${escapeHtml(o.status)}</span></td>
                    <td>${completed}/${tasks.length}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="viewTasks(${o.id})">
                            <i class="fas fa-eye"></i> Szczegóły
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#e74c3c;">Błąd: ${escapeHtml(err.message)}</td></tr>`;
    }
}

// ---------- Modal ze szczegółami zlecenia ----------
async function viewTasks(orderId) {
    try {
        const res = await api.getOrder(orderId);
        currentOrder = res.data;
        renderOrderModal(currentOrder);
        openModal('taskDetailsModal');
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

function renderOrderModal(order) {
    const titleEl = document.getElementById('modalTitle');
    const bodyEl  = document.getElementById('modalBody');

    const vehicle = `${order.make || ''} ${order.model || ''} (${order.license_plate || ''})`;
    const client  = `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim();

    titleEl.textContent = vehicle;

    const tasksHtml = (order.tasks || []).map((t, idx) => `
        <div class="task-card" data-task-id="${t.id}">
            <div class="task-card-header">
                <h4>Zadanie ${idx + 1}</h4>
                <span class="task-price">${formatPrice(t.price)}</span>
            </div>
            <div class="task-description">${escapeHtml(t.description)}</div>
            <div class="task-actions">
                <div class="checkbox-group">
                    <input type="checkbox" id="task_${t.id}_completed"
                           ${t.is_completed ? 'checked' : ''}
                           onchange="onCompletedChange(${t.id})">
                    <label for="task_${t.id}_completed">✓ Wykonane</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="task_${t.id}_parts"
                           ${t.needs_parts ? 'checked' : ''}
                           onchange="onNeedsPartsChange(${t.id})">
                    <label for="task_${t.id}_parts">🔧 Brakuje części</label>
                </div>
            </div>
        </div>
    `).join('');

    const partsHtml = (order.parts || []).map(p => `
        <div style="padding:6px 0;border-bottom:1px solid #eee;">
            <strong>${escapeHtml(p.name || 'Część')}</strong>:
            ${p.quantity} szt. × ${formatPrice(p.part_price)} =
            ${formatPrice(p.line_total)}
        </div>
    `).join('') || '<p style="color:#7f8c8d;font-style:italic;">Brak użytych części</p>';

    bodyEl.innerHTML = `
        <div class="card">
            <div class="card-body">
                <p><strong>Klient:</strong> ${escapeHtml(client)}</p>
                <p><strong>Status:</strong> <span class="badge ${statusBadgeClass(order.status)}">${escapeHtml(order.status)}</span></p>
                <p><strong>Suma zadań:</strong> ${formatPrice(order.tasks_total)} | <strong>Suma części:</strong> ${formatPrice(order.parts_total)} | <strong>Razem:</strong> ${formatPrice(order.total)}</p>
            </div>
        </div>

        <h4 class="mt-20">Zadania do wykonania:</h4>
        ${tasksHtml || '<p>Brak zadań</p>'}

        <h4 class="mt-20">Części użyte w zleceniu:</h4>
        ${partsHtml}

        <div class="btn-group mt-20">
            <button class="btn btn-success" onclick="saveTaskChanges()">
                <i class="fas fa-save"></i> Zapisz zmiany
            </button>
            <button class="btn btn-info" onclick="openAddPartDialog()">
                <i class="fas fa-plus"></i> Dodaj część do zlecenia
            </button>
            <button class="btn btn-secondary" onclick="closeModal('taskDetailsModal')">
                Zamknij
            </button>
        </div>
    `;
}

function onCompletedChange(taskId) {
    const completed = document.getElementById(`task_${taskId}_completed`).checked;
    if (completed) {
        // Zaznaczenie "Wykonane" wyklucza "Brakuje części"
        const np = document.getElementById(`task_${taskId}_parts`);
        if (np) np.checked = false;
    }
}

async function onNeedsPartsChange(taskId) {
    const cb = document.getElementById(`task_${taskId}_parts`);

    // Natychmiastowe wzajemne wykluczenie: zaznaczenie "Brakuje części" odznacza "Wykonane"
    if (cb.checked) {
        const completedCb = document.getElementById(`task_${taskId}_completed`);
        if (completedCb) completedCb.checked = false;
    } else {
        // Odznaczenie nie wymaga dialogu wyboru części
        return;
    }

    // Mechanik wybiera część z magazynu lub wpisuje nazwę do zamówienia
    const task = (currentOrder.tasks || []).find(t => t.id === taskId);
    if (!task) return;

    const choice = await openPartRequestDialog(task);
    if (!choice) {
        cb.checked = false;
        return;
    }

    try {
        await api.createRequest({
            part_id:          choice.partId || null,
            custom_part_name: choice.customName || null,
            quantity:         choice.quantity || 1,
            repair_task_id:   taskId
        });
        showNotification('Zgłoszenie wysłane do magazynu', 'success');

        // Po zgłoszeniu odśwież zlecenie (status mógł się zmienić)
        const res = await api.getOrder(currentOrder.id);
        currentOrder = res.data;
        renderOrderModal(currentOrder);
    } catch (err) {
        cb.checked = false;
        showNotification('Błąd zgłoszenia: ' + err.message, 'error');
    }
}

/**
 * Pokaż prosty modal wyboru części. Zwraca Promise z {partId, customName, quantity} lub null.
 */
async function openPartRequestDialog(task) {
    if (!currentParts.length) {
        try {
            const res = await api.listParts();
            currentParts = res.data || [];
        } catch {
            showNotification('Nie udało się pobrać magazynu', 'error');
            return null;
        }
    }

    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'modal active';
        overlay.style.zIndex = 11000;

        const partsOptions = currentParts.map(p =>
            `<option value="${p.id}">${escapeHtml(p.name)} (dost. ${p.quantity}, ${formatPrice(p.price)})</option>`
        ).join('');

        overlay.innerHTML = `
            <div class="modal-content" style="max-width:560px;">
                <div class="modal-header">
                    <h3>Zgłoszenie części</h3>
                    <span class="modal-close" data-action="cancel">&times;</span>
                </div>
                <div style="padding:0 20px;">
                    <p>Zadanie: <strong>${escapeHtml(task.description)}</strong></p>
                    <div class="form-group">
                        <label>
                            <input type="radio" name="reqType" value="stock" checked>
                            Część jest w magazynie
                        </label>
                        <select id="reqPartId">${partsOptions}</select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="radio" name="reqType" value="custom">
                            Brak w magazynie — trzeba zamówić
                        </label>
                        <input type="text" id="reqCustomName" placeholder="np. Pasek rozrządu Gates K015578XS">
                    </div>
                    <div class="form-group">
                        <label>Ilość</label>
                        <input type="number" id="reqQuantity" min="1" value="1">
                    </div>
                    <div class="btn-group" style="padding-bottom:20px;">
                        <button class="btn btn-success" data-action="ok">
                            <i class="fas fa-paper-plane"></i> Wyślij zgłoszenie
                        </button>
                        <button class="btn btn-secondary" data-action="cancel">Anuluj</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'cancel' || e.target === overlay) {
                overlay.remove();
                resolve(null);
            } else if (action === 'ok') {
                const type = overlay.querySelector('input[name="reqType"]:checked').value;
                const qty  = parseInt(overlay.querySelector('#reqQuantity').value) || 1;
                let result;
                if (type === 'stock') {
                    const partId = parseInt(overlay.querySelector('#reqPartId').value);
                    if (!partId) {
                        showNotification('Wybierz część', 'error');
                        return;
                    }
                    result = { partId, quantity: qty };
                } else {
                    const name = overlay.querySelector('#reqCustomName').value.trim();
                    if (!name) {
                        showNotification('Podaj nazwę części do zamówienia', 'error');
                        return;
                    }
                    result = { customName: name, quantity: qty };
                }
                overlay.remove();
                resolve(result);
            }
        });
    });
}

async function saveTaskChanges() {
    if (!currentOrder) return;

    const tasksPayload = (currentOrder.tasks || []).map(t => ({
        id: t.id,
        is_completed: document.getElementById(`task_${t.id}_completed`)?.checked ? 1 : 0,
        needs_parts:  document.getElementById(`task_${t.id}_parts`)?.checked ? 1 : 0
    }));

    try {
        const res = await api.updateOrderTasks(currentOrder.id, tasksPayload);
        const newStatus = res.data && res.data.status;
        showNotification(`Zapisano! Status: ${newStatus || '?'}`, 'success');
        closeModal('taskDetailsModal');
        loadCars();
        loadDashboard();
    } catch (err) {
        showNotification('Błąd zapisu: ' + err.message, 'error');
    }
}

// ---------- Dodawanie części z magazynu do zlecenia ----------
async function openAddPartDialog() {
    if (!currentOrder) return;
    if (!currentParts.length) {
        try {
            const res = await api.listParts();
            currentParts = res.data || [];
        } catch (err) {
            showNotification('Błąd pobrania magazynu: ' + err.message, 'error');
            return;
        }
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal active';
    overlay.style.zIndex = 11000;

    const opts = currentParts
        .filter(p => p.quantity > 0)
        .map(p => `<option value="${p.id}">${escapeHtml(p.name)} (dost. ${p.quantity}, ${formatPrice(p.price)})</option>`)
        .join('');

    overlay.innerHTML = `
        <div class="modal-content" style="max-width:520px;">
            <div class="modal-header">
                <h3>Dodaj część do zlecenia</h3>
                <span class="modal-close" data-action="cancel">&times;</span>
            </div>
            <div style="padding:0 20px;">
                <div class="form-group">
                    <label>Część z magazynu</label>
                    <select id="addPartId">${opts || '<option disabled>Brak dostępnych części</option>'}</select>
                </div>
                <div class="form-group">
                    <label>Ilość</label>
                    <input type="number" id="addPartQty" min="1" value="1">
                </div>
                <div class="btn-group" style="padding-bottom:20px;">
                    <button class="btn btn-success" data-action="ok">
                        <i class="fas fa-plus"></i> Dodaj
                    </button>
                    <button class="btn btn-secondary" data-action="cancel">Anuluj</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', async (e) => {
        const action = e.target.dataset.action;
        if (action === 'cancel' || e.target === overlay) {
            overlay.remove();
            return;
        }
        if (action === 'ok') {
            const partId = parseInt(overlay.querySelector('#addPartId').value);
            const qty    = parseInt(overlay.querySelector('#addPartQty').value) || 1;
            if (!partId) return;

            try {
                await api.addPartToOrder(currentOrder.id, partId, qty);
                showNotification(`Dodano ${qty} szt. do zlecenia`, 'success');
                overlay.remove();
                // Odśwież cache magazynu i dane zlecenia
                currentParts = (await api.listParts()).data || [];
                const res = await api.getOrder(currentOrder.id);
                currentOrder = res.data;
                renderOrderModal(currentOrder);
            } catch (err) {
                showNotification('Błąd: ' + err.message, 'error');
            }
        }
    });
}

// ---------- Moje zgłoszenia ----------
async function loadRequests() {
    const tbody = document.getElementById('requestsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Ładowanie…</td></tr>';
    try {
        const res = await api.listRequests({ mine: 1 });
        const reqs = res.data || [];
        if (!reqs.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Brak zgłoszeń</td></tr>';
            return;
        }

        tbody.innerHTML = reqs.map(r => {
            const typeCls = r.type === 'W magazynie' ? 'badge-success' : 'badge-danger';
            const statusCls =
                r.status === 'Gotowa do odbioru' ? 'badge-success' :
                r.status === 'Zamówiona'         ? 'badge-warning' :
                r.status === 'Odebrana'          ? 'badge-info'    : 'badge-secondary';

            // Przycisk "Odebrane" — widoczny tylko gdy status = "Gotowa do odbioru"
            const receiveBtn = r.status === 'Gotowa do odbioru'
                ? `<button class="btn btn-success btn-sm" onclick="markRequestReceived(${r.id})">
                       <i class="fas fa-check"></i> Odebrane
                   </button>`
                : '';

            return `
                <tr>
                    <td>${escapeHtml(r.part_name || '-')}</td>
                    <td>${r.quantity}</td>
                    <td><span class="badge ${typeCls}">${escapeHtml(r.type)}</span></td>
                    <td><span class="badge ${statusCls}">${escapeHtml(r.status)}</span></td>
                    <td>${formatDate(r.created_at)}</td>
                    <td>${receiveBtn}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#e74c3c;">Błąd: ${escapeHtml(err.message)}</td></tr>`;
    }
}

async function markRequestReceived(reqId) {
    if (!confirm('Potwierdzasz odbiór tej części z magazynu?')) return;
    try {
        await api.receiveRequest(reqId);
        showNotification('Część oznaczona jako odebrana — zniknie z listy po 24h', 'success');
        loadRequests();
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});
