/**
 * Panel recepcji — pełne podpięcie do api/*.php.
 *
 * Funkcje:
 *  - dashboard (statystyki),
 *  - tworzenie nowego zlecenia (klient + pojazd + zadania z service_types),
 *  - lista aut gotowych do odbioru + oznaczanie jako "Odebrane",
 *  - pełna lista zleceń + filtr statusu + podsumowanie + usuwanie.
 */

let mechanicsCache = [];
let serviceTypesCache = [];
let taskCounter = 0;

// ---------- Nawigacja ----------
function showDashboard() {
    showSection('dashboardSection');
    setActiveNav('navDashboard');
    document.getElementById('pageTitle').textContent = 'Dashboard';
    loadDashboard();
}
function showNewOrder() {
    showSection('newOrderSection');
    setActiveNav('navNewOrder');
    document.getElementById('pageTitle').textContent = 'Nowe zlecenie';
    initNewOrderForm();
}
function showReadyCars() {
    showSection('readyCarsSection');
    setActiveNav('navReadyCars');
    document.getElementById('pageTitle').textContent = 'Auta do oddania';
    loadReadyCars();
}
function showOrders() {
    showSection('ordersSection');
    setActiveNav('navOrders');
    document.getElementById('pageTitle').textContent = 'Wszystkie zlecenia';
    loadOrders();
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
        document.getElementById('statTotal').textContent      = s.total ?? 0;
        document.getElementById('statNotStarted').textContent = s.notStarted ?? 0;
        document.getElementById('statInProgress').textContent = s.inProgress ?? 0;
        document.getElementById('statReady').textContent      = s.ready ?? 0;
    } catch (err) {
        showNotification('Błąd statystyk: ' + err.message, 'error');
    }
}

// ---------- Nowe zlecenie ----------
async function initNewOrderForm() {
    // Załaduj raz mechaników i typy usług
    if (!mechanicsCache.length) {
        try {
            mechanicsCache = (await api.listUsers('mechanic')).data || [];
        } catch (err) {
            showNotification('Błąd pobierania mechaników: ' + err.message, 'error');
        }
    }
    if (!serviceTypesCache.length) {
        try {
            serviceTypesCache = (await api.listServiceTypes()).data || [];
        } catch (err) {
            showNotification('Błąd pobierania usług: ' + err.message, 'error');
        }
    }

    // Wypełnij select mechaników
    const sel = document.querySelector('select[name="mechanic"]');
    if (sel) {
        sel.innerHTML = '<option value="">-- Wybierz mechanika --</option>' +
            mechanicsCache.map(m => {
                const name = `${m.first_name || m.login} ${m.last_name || ''}`.trim();
                return `<option value="${m.id}">${escapeHtml(name)}</option>`;
            }).join('');
    }

    // Wyczyść listę zadań i dodaj jedno
    const list = document.getElementById('tasksList');
    if (list && !list.children.length) addTask();
}

function addTask() {
    taskCounter++;
    const tasksList = document.getElementById('tasksList');

    const opts = '<option value="">-- Wybierz usługę --</option>' +
        serviceTypesCache.map(s =>
            `<option value="${s.id}" data-price="${s.default_price}">${escapeHtml(s.name)} (${s.default_price.toFixed(2)} zł)</option>`
        ).join('') +
        '<option value="custom" data-price="0">🛠️ Inne — wpisz własne zadanie</option>';

    const div = document.createElement('div');
    div.className = 'task-item';
    div.id = `task_${taskCounter}`;
    div.style.cssText = 'border:1px solid #ddd;padding:15px;margin-bottom:15px;border-radius:8px;background:#f9f9f9;';
    div.innerHTML = `
        <div class="form-row">
            <div class="form-group" style="flex:2;">
                <label>Typ usługi *</label>
                <select name="task_service_${taskCounter}" onchange="updateTaskPrice(${taskCounter})" required>
                    ${opts}
                </select>
            </div>
            <div class="form-group">
                <label>Cena (zł) *</label>
                <input type="number" name="task_price_${taskCounter}" step="0.01" min="0" value="100.00" required>
            </div>
            <div class="form-group" style="flex:0 0 auto;">
                <label>&nbsp;</label>
                <button type="button" class="btn btn-danger" onclick="removeTask(${taskCounter})" style="width:100%;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="form-group" id="customDescGroup_${taskCounter}" style="display:none;">
            <label>Nazwa custom usługi *</label>
            <input type="text" name="task_custom_${taskCounter}" placeholder="np. Naprawa zamka centralnego">
        </div>
        <div class="form-group">
            <label>Dodatkowe informacje (opcjonalne)</label>
            <textarea name="task_notes_${taskCounter}" rows="2" placeholder="np. Wymiana przód, uwaga na zużyte tarcze..."></textarea>
        </div>
    `;
    tasksList.appendChild(div);
}

function updateTaskPrice(taskId) {
    const sel = document.querySelector(`select[name="task_service_${taskId}"]`);
    const price = document.querySelector(`input[name="task_price_${taskId}"]`);
    const customGroup = document.getElementById(`customDescGroup_${taskId}`);
    if (!sel || !price) return;

    if (sel.value === 'custom') {
        customGroup.style.display = '';
        price.value = '0.00';
    } else {
        customGroup.style.display = 'none';
        if (sel.selectedIndex > 0) {
            price.value = parseFloat(sel.options[sel.selectedIndex].dataset.price || 0).toFixed(2);
        }
    }
}

function removeTask(taskId) {
    document.getElementById(`task_${taskId}`)?.remove();
}

function clearOrderForm() {
    document.getElementById('newOrderForm').reset();
    document.getElementById('tasksList').innerHTML = '';
    taskCounter = 0;
    addTask();
}

// Submit nowego zlecenia
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('newOrderForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitNewOrder(e.target);
        });
    }
    loadDashboard();
});

async function submitNewOrder(form) {
    const fd = new FormData(form);
    const tasksList = document.getElementById('tasksList');
    if (!tasksList.children.length) {
        showNotification('Dodaj przynajmniej jedno zadanie!', 'error');
        return;
    }

    const tasks = [];
    Array.from(tasksList.children).forEach(div => {
        const sel = div.querySelector('select');
        const price = div.querySelector('input[type="number"]');
        const notes = div.querySelector('textarea');
        const customInput = div.querySelector('input[name^="task_custom_"]');
        if (!sel || !sel.value) return;

        const noteText = (notes?.value || '').trim();

        if (sel.value === 'custom') {
            const customName = (customInput?.value || '').trim();
            if (!customName) return;
            let description = customName;
            if (noteText) description += ` (${noteText})`;
            tasks.push({
                description,
                price: parseFloat(price.value) || 0,
                service_type_id: null
            });
        } else {
            const serviceId = parseInt(sel.value);
            const service = serviceTypesCache.find(s => s.id === serviceId);
            if (!service) return;
            let description = service.name;
            if (noteText) description += ` (${noteText})`;
            tasks.push({
                description,
                price: parseFloat(price.value) || 0,
                service_type_id: serviceId
            });
        }
    });

    if (!tasks.length) {
        showNotification('Wybierz typ usługi w przynajmniej jednym zadaniu', 'error');
        return;
    }

    const payload = {
        customer: {
            firstName: fd.get('firstName'),
            lastName:  fd.get('lastName'),
            phone:     fd.get('phone') || '',
            email:     fd.get('email') || ''
        },
        vehicle: {
            make:  fd.get('make'),
            model: fd.get('model'),
            year:  fd.get('year') ? parseInt(fd.get('year')) : null,
            plate: fd.get('plate'),
            vin:   fd.get('vin') || ''
        },
        mechanicId: parseInt(fd.get('mechanic')),
        tasks
    };

    try {
        const res = await api.createOrder(payload);
        // Pokaż recepcji wygenerowany kod dostępu klienta
        const accessCode = res.data && res.data.access_code;
        const plate = res.data && res.data.plate;
        const message = `Zlecenie #${res.data.id} dodane!\n\n` +
            `Dane do logowania klienta:\n` +
            `  Login (rejestracja): ${plate}\n` +
            `  Kod dostępu:         ${accessCode}\n\n` +
            `Przekaż te dane klientowi — będzie mógł śledzić swoje zlecenie online.`;
        alert(message);
        showNotification(`Zlecenie #${res.data.id} dodane`, 'success');
        clearOrderForm();
        loadDashboard();
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

// ---------- Auta gotowe do oddania ----------
async function loadReadyCars() {
    const tbody = document.getElementById('readyCarsTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Ładowanie…</td></tr>';
    try {
        const res = await api.listOrders({ status: 'Gotowe do odbioru' });
        const orders = res.data || [];
        if (!orders.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Brak aut gotowych do odbioru</td></tr>';
            return;
        }
        tbody.innerHTML = orders.map(o => {
            const client = `${o.customer_first_name || ''} ${o.customer_last_name || ''}`.trim();
            const mechanic = `${o.mechanic_first_name || ''} ${o.mechanic_last_name || ''}`.trim();
            return `
                <tr>
                    <td>${escapeHtml(client)}</td>
                    <td>${escapeHtml(`${o.make || ''} ${o.model || ''}`)}</td>
                    <td>${escapeHtml(o.license_plate || '')}</td>
                    <td>${escapeHtml(mechanic)}</td>
                    <td><strong>${formatPrice(o.total)}</strong></td>
                    <td>${formatDate(o.completed_at)}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="showOrderSummary(${o.id})">
                            <i class="fas fa-eye"></i> Podgląd
                        </button>
                        <button class="btn btn-success btn-sm" onclick="openInvoiceCreatorWithPayment(${o.id})">
                            <i class="fas fa-file-invoice-dollar"></i> Wystaw fakturę i wydaj auto
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#e74c3c;">Błąd: ${escapeHtml(err.message)}</td></tr>`;
    }
}

async function markAsPickedUp(orderId) {
    if (!confirm('Czy klient odebrał pojazd i zapłacił?')) return;
    try {
        await api.setOrderStatus(orderId, 'Odebrane');
        showNotification('Pojazd oznaczony jako odebrany', 'success');
        loadReadyCars();
        loadDashboard();
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

// ---------- Wszystkie zlecenia ----------
async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Ładowanie…</td></tr>';

    const filter = document.getElementById('ordersStatusFilter').value;
    try {
        const res = await api.listOrders(filter && filter !== 'Wszystkie' ? { status: filter } : {});
        const orders = res.data || [];
        if (!orders.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Brak zleceń</td></tr>';
            return;
        }
        tbody.innerHTML = orders.map(o => {
            const tasks = o.tasks || [];
            const completed = tasks.filter(t => t.is_completed).length;
            const client = `${o.customer_first_name || ''} ${o.customer_last_name || ''}`.trim();
            const mechanic = `${o.mechanic_first_name || ''} ${o.mechanic_last_name || ''}`.trim();
            return `
                <tr style="cursor:pointer;" onclick="showOrderSummary(${o.id})">
                    <td>${escapeHtml(client)}</td>
                    <td>${escapeHtml(`${o.make || ''} ${o.model || ''}`)}</td>
                    <td>${escapeHtml(mechanic)}</td>
                    <td><span class="badge ${statusBadgeClass(o.status)}">${escapeHtml(o.status)}</span></td>
                    <td>${completed}/${tasks.length}</td>
                    <td>${formatPrice(o.total)}</td>
                    <td>${formatDate(o.created_at)}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#e74c3c;">Błąd: ${escapeHtml(err.message)}</td></tr>`;
    }
}

// ---------- Podsumowanie zlecenia + edycja + faktura ----------
async function showOrderSummary(orderId) {
    try {
        const res = await api.getOrder(orderId);
        renderOrderSummaryModal(res.data);
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

function renderOrderSummaryModal(o) {
    const client   = `${o.customer_first_name || ''} ${o.customer_last_name || ''}`.trim();
    const mechanic = `${o.mechanic_first_name || ''} ${o.mechanic_last_name || ''}`.trim();
    const vehicle  = `${o.make || ''} ${o.model || ''} (${o.license_plate || ''})`;
    const canEditTasks = o.status === 'Nierozpoczęte' || o.status === 'W trakcie';

    const tasksHtml = (o.tasks || []).map(t => `
        <tr data-task-id="${t.id}">
            <td>${t.is_completed ? '✓' : '○'}</td>
            <td>
                <input type="text" class="task-desc"
                       value="${escapeHtml(t.description)}"
                       ${canEditTasks ? '' : 'readonly'}
                       style="width:100%;border:none;background:transparent;">
            </td>
            <td>
                <input type="number" class="task-price" step="0.01" min="0"
                       value="${parseFloat(t.price).toFixed(2)}"
                       ${canEditTasks ? '' : 'readonly'}
                       style="width:90px;text-align:right;">
            </td>
            <td>
                ${canEditTasks ? `<button class="btn btn-danger btn-sm" onclick="removeOrderTask(${t.id}, ${o.id})">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="4"><em>Brak zadań</em></td></tr>';

    const partsHtml = (o.parts || []).map(p => `
        <tr><td>${escapeHtml(p.name || 'Część')}</td><td>${p.quantity} szt.</td><td style="text-align:right;">${formatPrice(p.line_total)}</td></tr>
    `).join('') || '<tr><td colspan="3"><em>Brak części</em></td></tr>';

    const html = `
        <p><strong>Klient:</strong> ${escapeHtml(client)} (${escapeHtml(o.customer_phone || 'brak telefonu')})</p>
        <p><strong>Pojazd:</strong> ${escapeHtml(vehicle)}</p>
        <p><strong>Mechanik:</strong> ${escapeHtml(mechanic)}</p>
        <p><strong>Status:</strong> <span class="badge ${statusBadgeClass(o.status)}">${escapeHtml(o.status)}</span></p>

        <h4>Zadania <small style="font-weight:normal;color:#7f8c8d;">${canEditTasks ? '(można edytować ceny i opisy)' : '(zlecenie zamknięte — ceny zablokowane)'}</small></h4>
        <table style="width:100%;border-collapse:collapse;" id="tasksEditTable">
            <thead><tr style="background:#ecf0f1;">
                <th style="padding:6px;width:40px;">✓</th>
                <th style="padding:6px;text-align:left;">Opis</th>
                <th style="padding:6px;text-align:right;">Cena</th>
                <th style="padding:6px;width:60px;"></th>
            </tr></thead>
            <tbody>${tasksHtml}</tbody>
        </table>

        ${canEditTasks ? `
            <div style="margin-top:10px;display:flex;gap:8px;align-items:flex-end;">
                <div style="flex:2;">
                    <label style="font-size:12px;">Nowe zadanie</label>
                    <input type="text" id="newTaskDesc" placeholder="np. Naprawa zamka centralnego" style="width:100%;">
                </div>
                <div style="flex:0 0 100px;">
                    <label style="font-size:12px;">Cena</label>
                    <input type="number" id="newTaskPrice" step="0.01" min="0" value="100.00" style="width:100%;">
                </div>
                <button class="btn btn-success" onclick="addCustomTask(${o.id})">
                    <i class="fas fa-plus"></i> Dodaj
                </button>
            </div>
        ` : ''}

        <h4 style="margin-top:20px;">Części</h4>
        <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#ecf0f1;">
                <th style="padding:6px;text-align:left;">Część</th>
                <th style="padding:6px;text-align:left;">Ilość</th>
                <th style="padding:6px;text-align:right;">Razem</th>
            </tr></thead>
            <tbody>${partsHtml}</tbody>
        </table>

        <hr>
        <div style="display:flex;justify-content:space-between;font-size:16px;">
            <span>Zadania: <strong>${formatPrice(o.tasks_total)}</strong></span>
            <span>Części: <strong>${formatPrice(o.parts_total)}</strong></span>
            <span>Razem: <strong>${formatPrice(o.total)}</strong></span>
        </div>

        <div class="btn-group" style="margin-top:20px;flex-wrap:wrap;">
            ${canEditTasks ? `<button class="btn btn-primary" onclick="saveOrderEdits(${o.id})">
                <i class="fas fa-save"></i> Zapisz zmiany
            </button>` : ''}
            ${o.status === 'Gotowe do odbioru' ? `<button class="btn btn-success" onclick="openInvoiceCreator(${o.id})">
                <i class="fas fa-file-invoice"></i> Wystaw fakturę i wydaj klientowi
            </button>` : ''}
            <button class="btn btn-danger" onclick="deleteOrderConfirm(${o.id})">
                <i class="fas fa-trash"></i> Usuń zlecenie
            </button>
            <button class="btn btn-secondary" data-action="close">Zamknij</button>
        </div>
    `;
    showDetailsModal(`Zlecenie #${o.id}`, html);
}

async function saveOrderEdits(orderId) {
    const rows = document.querySelectorAll('#tasksEditTable tbody tr[data-task-id]');
    const tasks = Array.from(rows).map(r => ({
        id: parseInt(r.dataset.taskId),
        description: r.querySelector('.task-desc').value.trim(),
        price: parseFloat(r.querySelector('.task-price').value) || 0
    }));
    if (!tasks.length) return;
    try {
        await api.editTasks(orderId, tasks);
        showNotification('Zadania zaktualizowane', 'success');
        showOrderSummary(orderId);
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

async function addCustomTask(orderId) {
    const desc = document.getElementById('newTaskDesc').value.trim();
    const price = parseFloat(document.getElementById('newTaskPrice').value) || 0;
    if (!desc) {
        showNotification('Podaj opis zadania', 'error');
        return;
    }
    try {
        await api.addTask(orderId, desc, price);
        showNotification('Zadanie dodane', 'success');
        showOrderSummary(orderId);
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

async function removeOrderTask(taskId, orderId) {
    if (!confirm('Usunąć to zadanie?')) return;
    try {
        await api.deleteTask(taskId, orderId);
        showNotification('Zadanie usunięte', 'success');
        showOrderSummary(orderId);
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

async function deleteOrderConfirm(orderId) {
    if (!confirm('Na pewno usunąć całe zlecenie? (operacja nieodwracalna)')) return;
    try {
        await api.deleteOrder(orderId);
        showNotification('Zlecenie usunięte', 'success');
        document.getElementById('genericDetailsOverlay')?.remove();
        loadOrders();
        loadDashboard();
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

// ---------- Kreator faktur ----------
async function openInvoiceCreator(orderId) {
    return openInvoiceCreatorWithPayment(orderId);
}

async function openInvoiceCreatorWithPayment(orderId) {
    let order;
    try {
        const res = await api.getOrder(orderId);
        order = res.data;
    } catch (err) {
        showNotification('Nie udało się pobrać zlecenia: ' + err.message, 'error');
        return;
    }

    const buyerDefault = `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim();
    const today = new Date().toISOString().slice(0, 10);

    // Domyślne dane sprzedawcy (warsztatu) — można edytować
    const SELLER_DEFAULTS = {
        name:    'Warsztat Samochodowy Sp. z o.o.',
        nip:     '5252556677',
        address: 'ul. Mechaniczna 12, 00-001 Warszawa',
    };

    const tasksRows = (order.tasks || []).map(t =>
        `<tr><td>${escapeHtml(t.description)}</td><td style="text-align:right;">${formatPrice(t.price)}</td></tr>`
    ).join('');
    const partsRows = (order.parts || []).map(p =>
        `<tr><td>${escapeHtml(p.name || 'Część')} × ${p.quantity}</td><td style="text-align:right;">${formatPrice(p.line_total)}</td></tr>`
    ).join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal active';
    overlay.style.zIndex = 12500;
    overlay.innerHTML = `
        <div class="modal-content" style="max-width:780px;">
            <div class="modal-header">
                <h3><i class="fas fa-file-invoice-dollar"></i> Wystaw dokument sprzedaży — zlecenie #${orderId}</h3>
                <span class="modal-close" data-action="cancel">&times;</span>
            </div>
            <div style="padding:0 20px 20px;max-height:75vh;overflow-y:auto;">

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">
                    <label style="border:2px solid #3498db;padding:12px;border-radius:6px;cursor:pointer;text-align:center;background:#ecf0f1;" id="docTypeFakturaLabel">
                        <input type="radio" name="docType" value="invoice" checked id="docTypeFaktura" style="margin-right:6px;">
                        <i class="fas fa-file-invoice"></i> <strong>Faktura</strong>
                        <div style="font-size:11px;color:#7f8c8d;margin-top:4px;">Z danymi nabywcy + NIP</div>
                    </label>
                    <label style="border:2px solid #ddd;padding:12px;border-radius:6px;cursor:pointer;text-align:center;" id="docTypeParagonLabel">
                        <input type="radio" name="docType" value="receipt" id="docTypeParagon" style="margin-right:6px;">
                        <i class="fas fa-receipt"></i> <strong>Paragon</strong>
                        <div style="font-size:11px;color:#7f8c8d;margin-top:4px;">Bez danych nabywcy</div>
                    </label>
                </div>

                <details open style="margin-bottom:15px;">
                    <summary style="cursor:pointer;font-weight:bold;color:#2c3e50;padding:6px 0;">
                        Podgląd pozycji do dokumentu
                    </summary>
                    <table style="width:100%;font-size:13px;margin-top:8px;border-collapse:collapse;">
                        <thead><tr style="background:#ecf0f1;">
                            <th style="text-align:left;padding:6px;">Pozycja</th>
                            <th style="text-align:right;padding:6px;">Kwota</th>
                        </tr></thead>
                        <tbody>${tasksRows}${partsRows}</tbody>
                        <tfoot>
                            <tr style="font-size:16px;background:#f8f9fa;">
                                <td style="padding:8px;text-align:right;"><strong>RAZEM:</strong></td>
                                <td style="padding:8px;text-align:right;"><strong>${formatPrice(order.total)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </details>

                <h4 style="margin-bottom:8px;color:#2c3e50;">
                    <i class="fas fa-store"></i> Sprzedawca (warsztat)
                </h4>
                <div class="form-row">
                    <div class="form-group" style="flex:2;">
                        <label>Nazwa firmy *</label>
                        <input type="text" id="sellerName" value="${escapeHtml(SELLER_DEFAULTS.name)}" required>
                    </div>
                    <div class="form-group">
                        <label>NIP</label>
                        <input type="text" id="sellerNip" value="${escapeHtml(SELLER_DEFAULTS.nip)}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Adres</label>
                    <input type="text" id="sellerAddress" value="${escapeHtml(SELLER_DEFAULTS.address)}">
                </div>

                <div id="buyerSection">
                    <h4 style="margin:15px 0 8px;color:#2c3e50;">
                        <i class="fas fa-user"></i> Nabywca (klient)
                    </h4>
                    <div class="form-row">
                        <div class="form-group" style="flex:2;">
                            <label>Imię i nazwisko / Nazwa firmy *</label>
                            <input type="text" id="buyerName" value="${escapeHtml(buyerDefault)}" required>
                        </div>
                        <div class="form-group">
                            <label>NIP (opcjonalnie)</label>
                            <input type="text" id="buyerNip" placeholder="dla firm">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group" style="flex:2;">
                            <label>Ulica i numer</label>
                            <input type="text" id="buyerAddress" placeholder="ul. Klienta 5">
                        </div>
                        <div class="form-group">
                            <label>Kod pocztowy</label>
                            <input type="text" id="buyerPostcode" placeholder="00-000">
                        </div>
                        <div class="form-group">
                            <label>Miasto</label>
                            <input type="text" id="buyerCity" placeholder="Warszawa">
                        </div>
                    </div>
                </div>

                <h4 style="margin:15px 0 8px;color:#2c3e50;">
                    <i class="fas fa-credit-card"></i> Płatność
                </h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Sposób płatności *</label>
                        <select id="paymentMethod">
                            <option value="Gotówka">Gotówka</option>
                            <option value="Karta">Karta płatnicza</option>
                            <option value="Przelew">Przelew</option>
                            <option value="BLIK">BLIK</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Termin płatności</label>
                        <input type="date" id="dueDate" value="${today}">
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="invoicePaid" checked>
                        Klient zapłacił teraz (oznacz jako opłaconą)
                    </label>
                </div>

                <div class="form-group">
                    <label>Uwagi</label>
                    <textarea id="invoiceNotes" rows="2" placeholder="np. Gwarancja 6 miesięcy na wymienione części"></textarea>
                </div>

                <div class="btn-group">
                    <button class="btn btn-success" data-action="create" id="createDocBtn">
                        <i class="fas fa-check"></i> Wystaw fakturę i wydaj auto klientowi
                    </button>
                    <button class="btn btn-secondary" data-action="cancel">Anuluj</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Przełącznik Faktura/Paragon
    function updateDocTypeUI() {
        const isReceipt = overlay.querySelector('#docTypeParagon').checked;
        const buyerSection = overlay.querySelector('#buyerSection');
        const fakturaLbl = overlay.querySelector('#docTypeFakturaLabel');
        const paragonLbl = overlay.querySelector('#docTypeParagonLabel');
        const btn = overlay.querySelector('#createDocBtn');
        const buyerName = overlay.querySelector('#buyerName');

        if (isReceipt) {
            buyerSection.style.display = 'none';
            buyerName.required = false;
            fakturaLbl.style.borderColor = '#ddd';
            fakturaLbl.style.background = '';
            paragonLbl.style.borderColor = '#3498db';
            paragonLbl.style.background = '#ecf0f1';
            btn.innerHTML = '<i class="fas fa-receipt"></i> Wystaw paragon i wydaj auto klientowi';
        } else {
            buyerSection.style.display = '';
            buyerName.required = true;
            fakturaLbl.style.borderColor = '#3498db';
            fakturaLbl.style.background = '#ecf0f1';
            paragonLbl.style.borderColor = '#ddd';
            paragonLbl.style.background = '';
            btn.innerHTML = '<i class="fas fa-file-invoice"></i> Wystaw fakturę i wydaj auto klientowi';
        }
    }
    overlay.querySelectorAll('input[name="docType"]').forEach(r =>
        r.addEventListener('change', updateDocTypeUI)
    );

    overlay.addEventListener('click', async (e) => {
        const act = e.target.dataset.action;
        if (act === 'cancel' || e.target === overlay) {
            overlay.remove();
            return;
        }
        if (act === 'create') {
            const isReceipt = overlay.querySelector('#docTypeParagon').checked;
            const buyerName = overlay.querySelector('#buyerName').value.trim();
            if (!isReceipt && !buyerName) {
                showNotification('Podaj nazwę nabywcy dla faktury', 'error');
                return;
            }

            const payload = {
                order_id:       orderId,
                document_type:  isReceipt ? 'receipt' : 'invoice',
                notes:          overlay.querySelector('#invoiceNotes').value.trim(),
                paid:           overlay.querySelector('#invoicePaid').checked,
                seller_name:    overlay.querySelector('#sellerName').value.trim(),
                seller_nip:     overlay.querySelector('#sellerNip').value.trim(),
                seller_address: overlay.querySelector('#sellerAddress').value.trim(),
                buyer_name:     isReceipt ? '' : buyerName,
                buyer_nip:      isReceipt ? '' : overlay.querySelector('#buyerNip').value.trim(),
                buyer_address:  isReceipt ? '' : overlay.querySelector('#buyerAddress').value.trim(),
                buyer_city:     isReceipt ? '' : overlay.querySelector('#buyerCity').value.trim(),
                buyer_postcode: isReceipt ? '' : overlay.querySelector('#buyerPostcode').value.trim(),
                payment_method: overlay.querySelector('#paymentMethod').value,
                due_date:       overlay.querySelector('#dueDate').value,
            };

            try {
                const res = await api.createInvoice(payload);
                const docName = res.data.document_type === 'receipt' ? 'Paragon' : 'Faktura';
                showNotification(`${docName} ${res.data.invoice_number} wystawiona`, 'success');
                overlay.remove();
                document.getElementById('genericDetailsOverlay')?.remove();
                showInvoice(res.data.id);
                loadOrders();
                loadReadyCars();
                loadInvoices?.();
                loadDashboard();
            } catch (err) {
                showNotification('Błąd: ' + err.message, 'error');
            }
        }
    });
}

// (Auto-zmiana terminu płatności została wyłączona — termin to zawsze
//  bieżący dzień; recepcja może go ręcznie zmienić w polu daty.)

async function showInvoice(invoiceId) {
    try {
        const res = await api.getInvoice(invoiceId);
        const inv = res.data;
        showDetailsModal(`Faktura ${inv.invoice_number}`, renderInvoiceFullHtml(inv, { canMarkPaid: true }));
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

async function markInvoicePaid(id) {
    try {
        await api.setInvoicePaid(id, true);
        showNotification('Faktura oznaczona jako opłacona', 'success');
        showInvoice(id);
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

// ---------- Lista faktur w panelu recepcji ----------
async function loadInvoices() {
    const tbody = document.getElementById('invoicesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Ładowanie…</td></tr>';
    try {
        const res = await api.listInvoices();
        const invs = res.data || [];
        if (!invs.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Brak faktur</td></tr>';
            return;
        }
        tbody.innerHTML = invs.map(inv => {
            const docBadge = inv.document_type === 'receipt'
                ? '<span class="badge badge-secondary"><i class="fas fa-receipt"></i> Paragon</span>'
                : '<span class="badge badge-info"><i class="fas fa-file-invoice"></i> Faktura</span>';
            return `
            <tr>
                <td>${docBadge}</td>
                <td><strong>${escapeHtml(inv.invoice_number)}</strong></td>
                <td>${escapeHtml(inv.customer_first_name || '')} ${escapeHtml(inv.customer_last_name || '')}</td>
                <td>${escapeHtml(inv.make || '')} ${escapeHtml(inv.model || '')} (${escapeHtml(inv.license_plate || '')})</td>
                <td>${formatPrice(inv.total)}</td>
                <td>${inv.paid ? '<span class="badge badge-success">Opłacona</span>' : '<span class="badge badge-warning">Do zapłaty</span>'}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="showInvoice(${inv.id})">
                        <i class="fas fa-eye"></i> Pokaż
                    </button>
                </td>
            </tr>
        `;}).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#e74c3c;">Błąd: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function showInvoices() {
    showSection('invoicesSection');
    setActiveNav('navInvoices');
    document.getElementById('pageTitle').textContent = 'Faktury';
    loadInvoices();
}


// ===========================================================
// Kody dostępu klientów (recepcja)
// ===========================================================
function showPasswords() {
    showSection('passwordsSection');
    setActiveNav('navPasswords');
    document.getElementById('pageTitle').textContent = 'Kody dostępu klientów';
    loadVehicles();
}

let vehiclesCache = [];
let searchTimer   = null;

async function loadVehicles(search = '') {
    const tbody = document.getElementById('vehiclesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Ładowanie…</td></tr>';
    try {
        const params = {};
        if (search) params.search = search;
        const res = await api.listVehicles(params);
        vehiclesCache = res.data || [];
        renderVehicles(vehiclesCache);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#e74c3c;">Błąd: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function searchVehicles(query) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadVehicles(query.trim()), 300);
}

function renderVehicles(vehicles) {
    const tbody = document.getElementById('vehiclesTableBody');
    if (!tbody) return;
    if (!vehicles.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Brak pojazdów</td></tr>';
        return;
    }
    tbody.innerHTML = vehicles.map(v => `
        <tr>
            <td><strong>${escapeHtml(v.license_plate || '—')}</strong></td>
            <td>${escapeHtml(v.make || '')} ${escapeHtml(v.model || '')} ${v.year ? `(${v.year})` : ''}</td>
            <td>${escapeHtml(v.customer_name || '—')}</td>
            <td>${escapeHtml(v.customer_phone || '—')}</td>
            <td>
                <code style="background:#2c3e50;color:#e74c3c;padding:4px 10px;
                             border-radius:4px;font-size:16px;font-weight:bold;
                             letter-spacing:2px;">
                    ${escapeHtml(v.access_code || '—')}
                </code>
            </td>
            <td>
                <button class="btn btn-warning btn-sm"
                        onclick="regenerateVehicleCode(${v.id}, '${escapeHtml(v.license_plate || '')}')">
                    <i class="fas fa-sync"></i> Nowy kod
                </button>
            </td>
        </tr>
    `).join('');
}

async function regenerateVehicleCode(vehicleId, plate) {
    if (!confirm(`Wygenerować nowy kod dla pojazdu ${plate}?\n\nStary kod przestaje działać — przekaż nowy kod klientowi!`)) return;
    try {
        const res = await api.regenerateCode(vehicleId);
        const newCode = res.data.access_code;
        showDetailsModal(
            `Nowy kod dostępu — ${plate}`,
            `<div style="text-align:center;padding:20px 0;">
                <p style="font-size:14px;color:#7f8c8d;margin-bottom:15px;">Przekaż klientowi:</p>
                <p style="font-size:14px;margin-bottom:6px;">
                    <strong>Login (nr rejestracyjny):</strong><br>
                    <code style="font-size:20px;">${escapeHtml(plate)}</code>
                </p>
                <p style="font-size:14px;margin-top:15px;">
                    <strong>Kod dostępu (hasło):</strong><br>
                    <code style="font-size:36px;font-weight:bold;letter-spacing:4px;
                                 background:#2c3e50;color:#e74c3c;
                                 padding:10px 20px;border-radius:6px;
                                 display:inline-block;margin-top:8px;">
                        ${escapeHtml(newCode)}
                    </code>
                </p>
                <p style="font-size:12px;color:#e74c3c;margin-top:20px;">
                    ⚠️ Stary kod jest już nieważny.
                </p>
            </div>`
        );
        loadVehicles(document.getElementById('vehicleSearchInput')?.value || '');
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}
