/**
 * Panel admina — pełne podpięcie do api/*.php.
 */

let chartTodayInst = null;
let chartCarsInst = null;
let chartFinanceInst = null;

// ---------- Nawigacja ----------
function showDashboard() {
    showSection('dashboardSection');
    setActiveNav('navDashboard');
    document.getElementById('pageTitle').textContent = 'Dashboard';
    loadDashboard();
}
function showUsers() {
    showSection('usersSection');
    setActiveNav('navUsers');
    document.getElementById('pageTitle').textContent = 'Pracownicy';
    loadUsers();
}
function showClients() {
    showSection('clientsSection');
    setActiveNav('navClients');
    document.getElementById('pageTitle').textContent = 'Klienci';
    loadClients();
}
function showRepairs() {
    showSection('repairsSection');
    setActiveNav('navRepairs');
    document.getElementById('pageTitle').textContent = 'Naprawy';
    loadRepairs();
}

// ---------- Dashboard + profil + statystyki ----------
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
        document.getElementById('statCompletedToday').textContent = s.completedToday ?? 0;
        document.getElementById('statPickedUp').textContent = s.pickedUp ?? 0;

        document.getElementById('statIncome').textContent = formatPrice(s.income ?? 0);
        document.getElementById('statPartsCost').textContent = formatPrice(s.partsCost ?? 0);
        document.getElementById('statNetProfit').textContent = formatPrice(s.netProfit ?? 0);

        renderCharts(s);
    } catch (err) {
        showNotification('Nie udało się pobrać statystyk: ' + err.message, 'error');
    }
}

function renderCharts(s) {
    if (chartTodayInst) chartTodayInst.destroy();
    if (chartCarsInst) chartCarsInst.destroy();
    if (chartFinanceInst) chartFinanceInst.destroy();

    // Aktywność dzisiaj
    chartTodayInst = new Chart(document.getElementById('chartToday'), {
        type: 'bar',
        data: {
            labels: ['Przyjęte', 'Skończone', 'Wydane'],
            datasets: [{
                label: 'Liczba aut',
                data: [s.arrivedToday ?? 0, s.completedToday ?? 0, s.pickedUpToday ?? 0],
                backgroundColor: ['#3498db', '#27ae60', '#9b59b6']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } }
        }
    });

    // Auta na warsztacie
    const carsMap = s.carsInWorkshop || {};
    const labels = Object.keys(carsMap).filter(k => carsMap[k] > 0);
    const values = labels.map(k => carsMap[k]);
    const colors = {
        'Nierozpoczęte':     '#e74c3c',
        'W trakcie':         '#f39c12',
        'Czeka na części':   '#95a5a6',
        'Gotowe do odbioru': '#27ae60'
    };

    chartCarsInst = new Chart(document.getElementById('chartCars'), {
        type: 'pie',
        data: {
            labels: labels.length ? labels : ['Brak aut'],
            datasets: [{
                data: values.length ? values : [1],
                backgroundColor: labels.length ? labels.map(l => colors[l] || '#bdc3c7') : ['#bdc3c7']
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    // Finanse dzisiaj
    chartFinanceInst = new Chart(document.getElementById('chartFinance'), {
        type: 'bar',
        data: {
            labels: ['Dochód', 'Wydatki', 'Zysk'],
            datasets: [{
                label: 'Kwota (zł)',
                data: [s.income ?? 0, s.partsCost ?? 0, s.netProfit ?? 0],
                backgroundColor: ['#27ae60', '#e74c3c', '#2980b9']
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

// ---------- Pracownicy ----------
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Ładowanie…</td></tr>';
    try {
        const res = await api.listUsers();
        const users = res.data || [];
        if (!users.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Brak pracowników</td></tr>';
            return;
        }
        tbody.innerHTML = users.map(u => `
            <tr style="cursor:pointer;" onclick="showUserDetails(${u.id})">
                <td>${escapeHtml(u.login)}</td>
                <td><span class="badge badge-info">${escapeHtml(u.role)}</span></td>
                <td>${escapeHtml(u.first_name || '')}</td>
                <td>${escapeHtml(u.last_name || '')}</td>
                <td>${escapeHtml(u.email || '')}</td>
                <td>${escapeHtml(u.phone || '')}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="event.stopPropagation();showUserDetails(${u.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteUser(${u.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#e74c3c;">Błąd: ${escapeHtml(err.message)}</td></tr>`;
    }
}

async function deleteUser(userId) {
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;
    try {
        await api.deleteUser(userId);
        showNotification('Użytkownik usunięty', 'success');
        loadUsers();
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

document.getElementById('addUserForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const fd = new FormData(e.target);

    const phone = (fd.get('phone') || '').trim();
    if (phone && !/^\d{9}$/.test(phone)) {
        showNotification('Telefon musi mieć 9 cyfr', 'error');
        return;
    }

    const payload = {
        login:      fd.get('login'),
        password:   fd.get('password'),
        role:       fd.get('role'),
        first_name: fd.get('firstName'),
        last_name:  fd.get('lastName'),
        email:      fd.get('email'),
        phone
    };

    try {
        await api.addUser(payload);
        showNotification('Pracownik dodany', 'success');
        closeModal('addUserModal');
        e.target.reset();
        loadUsers();
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
});

// ---------- Klienci ----------
async function loadClients() {
    const tbody = document.getElementById('clientsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Ładowanie…</td></tr>';
    try {
        const res = await api.listCustomers();
        const clients = res.data || [];
        if (!clients.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Brak klientów</td></tr>';
            return;
        }
        tbody.innerHTML = clients.map(c => `
            <tr style="cursor:pointer;" onclick="showClientDetails(${c.id})">
                <td>${escapeHtml(c.first_name)}</td>
                <td>${escapeHtml(c.last_name)}</td>
                <td>${escapeHtml(c.phone || '')}</td>
                <td>${escapeHtml(c.email || '')}</td>
                <td>${c.vehicles_count || 0}</td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#e74c3c;">Błąd: ${escapeHtml(err.message)}</td></tr>`;
    }
}

// ---------- Naprawy ----------
async function loadRepairs() {
    const tbody = document.getElementById('repairsTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Ładowanie…</td></tr>';
    try {
        const res = await api.listOrders();
        const orders = res.data || [];
        if (!orders.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Brak zleceń</td></tr>';
            return;
        }
        tbody.innerHTML = orders.map(o => {
            const tasks = o.tasks || [];
            const completed = tasks.filter(t => t.is_completed).length;
            const vehicle = `${o.make || ''} ${o.model || ''} ${o.license_plate ? '(' + o.license_plate + ')' : ''}`;
            const client = `${o.customer_first_name || ''} ${o.customer_last_name || ''}`.trim();
            const mechanic = `${o.mechanic_first_name || ''} ${o.mechanic_last_name || ''}`.trim();
            const statusCls = statusBadgeClass(o.status);
            return `
                <tr style="cursor:pointer;" onclick="showOrderDetailsAdmin(${o.id})">
                    <td>${escapeHtml(vehicle)}</td>
                    <td>${escapeHtml(client)}</td>
                    <td>${escapeHtml(mechanic)}</td>
                    <td><span class="badge ${statusCls}">${escapeHtml(o.status)}</span></td>
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

// Init
document.addEventListener('DOMContentLoaded', function () {
    loadDashboard();
});

// ===========================================================
// Szczegóły pracownika / klienta / zlecenia (klikalne wiersze)
// ===========================================================

async function showUserDetails(userId) {
    try {
        const res = await api.getUser(userId);
        const u = res.data;

        let extra = '';
        if (u.role === 'mechanic') {
            const ordersByStatus = u.orders_by_status || {};
            const statusList = Object.entries(ordersByStatus)
                .map(([s, n]) => `<li>${escapeHtml(s)}: <strong>${n}</strong></li>`)
                .join('') || '<li>Brak zleceń</li>';

            const recentRows = (u.recent_orders || []).map(o => `
                <tr style="cursor:pointer;" onclick="showOrderDetailsAdmin(${o.id})">
                    <td>#${o.id}</td>
                    <td>${escapeHtml(o.make || '')} ${escapeHtml(o.model || '')} (${escapeHtml(o.license_plate || '')})</td>
                    <td><span class="badge ${statusBadgeClass(o.status)}">${escapeHtml(o.status)}</span></td>
                    <td>${formatDate(o.created_at)}</td>
                </tr>
            `).join('') || '<tr><td colspan="4">Brak</td></tr>';

            extra = `
                <h4>Statystyki mechanika (łącznie ${u.orders_total || 0} zleceń)</h4>
                <ul>${statusList}</ul>
                <h4>Ostatnie zlecenia</h4>
                <table style="width:100%;">
                    <thead><tr><th>ID</th><th>Pojazd</th><th>Status</th><th>Data</th></tr></thead>
                    <tbody>${recentRows}</tbody>
                </table>
            `;
        }

        const html = `
            <p><strong>Login:</strong> ${escapeHtml(u.login)}</p>
            <p><strong>Imię i nazwisko:</strong> ${escapeHtml(u.first_name || '')} ${escapeHtml(u.last_name || '')}</p>
            <p><strong>Rola:</strong> <span class="badge badge-info">${escapeHtml(u.role)}</span></p>
            <p><strong>Telefon:</strong> ${escapeHtml(u.phone || 'Brak')}</p>
            <p><strong>Email:</strong> ${escapeHtml(u.email || 'Brak')}</p>
            <p><strong>Utworzony:</strong> ${formatDate(u.created_at)}</p>
            ${extra}
        `;
        showDetailsModal(`Pracownik: ${u.login}`, html);
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

async function showClientDetails(clientId) {
    try {
        const res = await api.getCustomer(clientId);
        const c = res.data;

        // Sekcja: każde auto klienta + jego naprawy (zlecenia z zadaniami)
        let vehiclesHtml = '';
        if (!c.vehicles || c.vehicles.length === 0) {
            vehiclesHtml = '<p style="color:#7f8c8d;"><em>Brak pojazdów</em></p>';
        } else {
            vehiclesHtml = c.vehicles.map(v => {
                const orders = v.orders || [];

                // Każde zlecenie auta
                const ordersHtml = orders.length === 0
                    ? '<p style="color:#7f8c8d;font-style:italic;padding:8px;">Brak napraw dla tego auta</p>'
                    : orders.map(o => {
                        const tasks = o.tasks || [];
                        const tasksList = tasks.map(t =>
                            `<li>${t.is_completed ? '✓' : '○'}${t.needs_parts ? ' 🔧' : ''} ${escapeHtml(t.description)} — <strong>${formatPrice(t.price)}</strong></li>`
                        ).join('') || '<li><em>Brak zadań</em></li>';

                        const partsList = (o.parts || []).map(p =>
                            `<li>${escapeHtml(p.name || 'Część')}: ${p.quantity} szt. × ${formatPrice(p.part_price)} = <strong>${formatPrice(p.line_total)}</strong></li>`
                        ).join('');

                        const mechanic = `${o.mechanic_first_name || ''} ${o.mechanic_last_name || ''}`.trim() || (o.mechanic_login || '—');

                        return `
                            <div style="border:1px solid #ecf0f1;border-radius:6px;margin:8px 0;padding:10px;cursor:pointer;background:#fafbfc;"
                                 onclick="showOrderDetailsAdmin(${o.id})">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                                    <strong>Zlecenie #${o.id}</strong>
                                    <span class="badge ${statusBadgeClass(o.status)}">${escapeHtml(o.status)}</span>
                                </div>
                                <div style="font-size:13px;color:#555;margin-bottom:6px;">
                                    Mechanik: ${escapeHtml(mechanic)} |
                                    Data: ${formatDate(o.created_at)} |
                                    Razem: <strong>${formatPrice(o.total)}</strong>
                                </div>
                                <details>
                                    <summary style="cursor:pointer;color:#3498db;font-size:13px;">
                                        Pokaż zadania (${tasks.length})
                                    </summary>
                                    <ul style="margin:6px 0 0 0;font-size:13px;">${tasksList}</ul>
                                    ${partsList ? `<div style="font-size:13px;margin-top:6px;"><strong>Części:</strong><ul style="margin:4px 0;">${partsList}</ul></div>` : ''}
                                </details>
                            </div>
                        `;
                    }).join('');

                const accessCodeInfo = v.access_code
                    ? `<small style="color:#7f8c8d;">Kod dostępu klienta: <code>${escapeHtml(v.access_code)}</code></small>`
                    : '';

                return `
                    <div style="border:2px solid #3498db;border-radius:8px;padding:12px;margin-bottom:14px;background:#f8fbff;">
                        <h4 style="margin:0 0 6px 0;">
                            🚗 ${escapeHtml(v.make || '')} ${escapeHtml(v.model || '')}
                            ${v.year ? `<small>(${v.year})</small>` : ''}
                            <span class="badge badge-info" style="margin-left:8px;">${escapeHtml(v.license_plate || '')}</span>
                        </h4>
                        ${v.vin ? `<small style="color:#7f8c8d;">VIN: ${escapeHtml(v.vin)}</small><br>` : ''}
                        ${accessCodeInfo}
                        <div style="margin-top:10px;">
                            <strong>Naprawy (${orders.length}):</strong>
                            ${ordersHtml}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Sekcja faktur
        const invoicesHtml = (c.invoices || []).length === 0
            ? '<p style="color:#7f8c8d;"><em>Brak faktur</em></p>'
            : `<table style="width:100%;font-size:13px;">
                  <thead><tr><th>Numer</th><th>Pojazd</th><th>Suma</th><th>Status</th><th>Data</th></tr></thead>
                  <tbody>
                  ${(c.invoices || []).map(inv => `
                      <tr style="cursor:pointer;" onclick="showInvoiceAdmin(${inv.id})">
                          <td><strong>${escapeHtml(inv.invoice_number)}</strong></td>
                          <td>${escapeHtml(inv.make || '')} ${escapeHtml(inv.model || '')} (${escapeHtml(inv.license_plate || '')})</td>
                          <td>${formatPrice(inv.total)}</td>
                          <td>${inv.paid ? '<span class="badge badge-success">Opłacona</span>' : '<span class="badge badge-warning">Do zapłaty</span>'}</td>
                          <td>${formatDate(inv.issued_at)}</td>
                      </tr>
                  `).join('')}
                  </tbody>
               </table>`;

        const html = `
            <div style="background:#ecf0f1;padding:12px;border-radius:6px;margin-bottom:15px;">
                <p style="margin:0;"><strong>${escapeHtml(c.first_name)} ${escapeHtml(c.last_name)}</strong></p>
                <p style="margin:4px 0;font-size:13px;"><i class="fas fa-phone"></i> ${escapeHtml(c.phone || 'Brak')}</p>
                <p style="margin:4px 0;font-size:13px;"><i class="fas fa-envelope"></i> ${escapeHtml(c.email || 'Brak')}</p>
            </div>

            <h4 style="margin:15px 0 10px;">
                <i class="fas fa-car"></i> Pojazdy w naprawie (${(c.vehicles || []).length})
            </h4>
            ${vehiclesHtml}

            <h4 style="margin:20px 0 10px;">
                <i class="fas fa-file-invoice"></i> Faktury (${(c.invoices || []).length})
            </h4>
            ${invoicesHtml}
        `;
        showDetailsModal(`Klient: ${c.first_name} ${c.last_name}`, html);
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

async function showOrderDetailsAdmin(orderId) {
    try {
        const res = await api.getOrder(orderId);
        const o = res.data;

        const tasksHtml = (o.tasks || []).map(t =>
            `<li>${t.is_completed ? '✓' : '○'} ${t.needs_parts ? '🔧 ' : ''}${escapeHtml(t.description)} — <strong>${formatPrice(t.price)}</strong></li>`
        ).join('') || '<li>Brak zadań</li>';

        const partsHtml = (o.parts || []).map(p =>
            `<li>${escapeHtml(p.name || 'Część')}: ${p.quantity} szt. × ${formatPrice(p.part_price)} = <strong>${formatPrice(p.line_total)}</strong></li>`
        ).join('') || '<li>Brak części</li>';

        const html = `
            <p><strong>Klient:</strong> ${escapeHtml((o.customer_first_name || '') + ' ' + (o.customer_last_name || ''))}</p>
            <p><strong>Pojazd:</strong> ${escapeHtml(o.make || '')} ${escapeHtml(o.model || '')} (${escapeHtml(o.license_plate || '')})</p>
            <p><strong>Mechanik:</strong> ${escapeHtml((o.mechanic_first_name || '') + ' ' + (o.mechanic_last_name || ''))}</p>
            <p><strong>Status:</strong> <span class="badge ${statusBadgeClass(o.status)}">${escapeHtml(o.status)}</span></p>
            <p><strong>Utworzone:</strong> ${formatDate(o.created_at)}</p>

            <h4>Zadania</h4>
            <ul>${tasksHtml}</ul>
            <p style="text-align:right;">Suma zadań: <strong>${formatPrice(o.tasks_total)}</strong></p>

            <h4>Części</h4>
            <ul>${partsHtml}</ul>
            <p style="text-align:right;">Suma części: <strong>${formatPrice(o.parts_total)}</strong></p>

            <hr>
            <p style="text-align:right;font-size:18px;">RAZEM: <strong>${formatPrice(o.total)}</strong></p>
        `;
        showDetailsModal(`Zlecenie #${orderId}`, html);
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

// ===========================================================
// Faktury (admin ma podgląd wszystkich)
// ===========================================================
function showInvoices() {
    showSection('invoicesSection');
    setActiveNav('navInvoices');
    document.getElementById('pageTitle').textContent = 'Faktury';
    loadInvoices();
}

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
                    <button class="btn btn-info btn-sm" onclick="showInvoiceAdmin(${inv.id})">
                        <i class="fas fa-eye"></i> Pokaż
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteInvoiceAdmin(${inv.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;}).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#e74c3c;">Błąd: ${escapeHtml(err.message)}</td></tr>`;
    }
}

async function showInvoiceAdmin(invoiceId) {
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
        showInvoiceAdmin(id);
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

async function deleteInvoiceAdmin(id) {
    if (!confirm('Cofnąć wystawienie tej faktury? (operacja nieodwracalna)')) return;
    try {
        await api.deleteInvoice(id);
        showNotification('Faktura usunięta', 'success');
        loadInvoices();
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}
