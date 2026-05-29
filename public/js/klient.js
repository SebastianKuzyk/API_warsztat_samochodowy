/**
 * Panel klienta — widok zleceń, pojazdów, faktur.
 * Logowanie: numer rejestracyjny + kod dostępu (auth.php?action=client_login).
 */

let clientData = null;

function showDashboard() {
    showSection('dashboardSection');
    setActiveNav('navDashboard');
    document.getElementById('pageTitle').textContent = 'Mój panel';
    renderDashboard();
}
function showOrders() {
    showSection('ordersSection');
    setActiveNav('navOrders');
    document.getElementById('pageTitle').textContent = 'Moje zlecenia';
    renderOrders();
}
function showInvoices() {
    showSection('invoicesSection');
    setActiveNav('navInvoices');
    document.getElementById('pageTitle').textContent = 'Faktury';
    renderInvoices();
}

async function loadAll() {
    try {
        const res = await api.clientDashboard();
        clientData = res.data;
        renderDashboard();
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

function renderDashboard() {
    if (!clientData) return;

    const c = clientData.customer;
    const user = auth.getUser();
    document.getElementById('profileName').textContent = `Witaj, ${c.first_name || user.login}!`;
    document.getElementById('profileFullName').textContent = `${c.first_name} ${c.last_name}`.trim();
    document.getElementById('profilePhone').textContent = (user && user.phone) || 'Brak';
    document.getElementById('profileEmail').textContent = (user && user.email) || 'Brak';

    // Pojazdy
    const vehiclesEl = document.getElementById('vehiclesList');
    if (!clientData.vehicles.length) {
        vehiclesEl.innerHTML = '<p style="color:#7f8c8d;">Brak pojazdów</p>';
    } else {
        vehiclesEl.innerHTML = clientData.vehicles.map(v => `
            <div style="padding:12px;border:1px solid #ecf0f1;border-radius:6px;margin-bottom:8px;">
                <strong>${escapeHtml(v.make)} ${escapeHtml(v.model)}</strong>
                ${v.year ? `(${v.year})` : ''}
                — <span class="badge badge-info">${escapeHtml(v.license_plate)}</span>
                ${v.vin ? `<br><small style="color:#7f8c8d;">VIN: ${escapeHtml(v.vin)}</small>` : ''}
            </div>
        `).join('');
    }

    // Aktywne zlecenia (status != Odebrane)
    const active = clientData.orders.filter(o => o.status !== 'Odebrane');
    const activeEl = document.getElementById('activeOrdersList');
    if (!active.length) {
        activeEl.innerHTML = '<p style="color:#7f8c8d;">Brak aktywnych zleceń</p>';
    } else {
        activeEl.innerHTML = active.map(o => orderCard(o)).join('');
    }
}

function orderCard(o) {
    const mechanic = `${o.mechanic_first_name || ''} ${o.mechanic_last_name || ''}`.trim() || '—';
    const tasks = o.tasks || [];
    const completed = tasks.filter(t => t.is_completed).length;
    return `
        <div class="task-card" onclick="showOrderDetails(${o.id})" style="cursor:pointer;">
            <div class="task-card-header">
                <h4>${escapeHtml(o.make)} ${escapeHtml(o.model)} (${escapeHtml(o.license_plate)})</h4>
                <span class="badge ${statusBadgeClass(o.status)}">${escapeHtml(o.status)}</span>
            </div>
            <div class="task-description">
                Mechanik: ${escapeHtml(mechanic)} |
                Zadania: ${completed}/${tasks.length} |
                Suma: <strong>${formatPrice(o.total)}</strong> |
                Data: ${formatDate(o.created_at)}
            </div>
        </div>
    `;
}

function renderOrders() {
    if (!clientData) return;
    const tbody = document.getElementById('ordersTableBody');
    if (!clientData.orders.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Brak zleceń</td></tr>';
        return;
    }
    tbody.innerHTML = clientData.orders.map(o => {
        const mechanic = `${o.mechanic_first_name || ''} ${o.mechanic_last_name || ''}`.trim() || '—';
        return `
            <tr style="cursor:pointer;" onclick="showOrderDetails(${o.id})">
                <td>#${o.id}</td>
                <td>${escapeHtml(o.make)} ${escapeHtml(o.model)} (${escapeHtml(o.license_plate)})</td>
                <td>${escapeHtml(mechanic)}</td>
                <td><span class="badge ${statusBadgeClass(o.status)}">${escapeHtml(o.status)}</span></td>
                <td>${formatPrice(o.total)}</td>
                <td>${formatDate(o.created_at)}</td>
                <td><button class="btn btn-info btn-sm"><i class="fas fa-eye"></i> Szczegóły</button></td>
            </tr>
        `;
    }).join('');
}

function showOrderDetails(orderId) {
    const o = clientData.orders.find(x => x.id === orderId);
    if (!o) return;

    const tasksHtml = (o.tasks || []).map(t =>
        `<li>${t.is_completed ? '✓' : '○'} ${escapeHtml(t.description)} — <strong>${formatPrice(t.price)}</strong></li>`
    ).join('') || '<li>Brak zadań</li>';

    const partsHtml = (o.parts || []).map(p =>
        `<li>${escapeHtml(p.name || 'Część')}: ${p.quantity} szt. × ${formatPrice(p.part_price)} = <strong>${formatPrice(p.line_total)}</strong></li>`
    ).join('') || '<li>Brak części</li>';

    const html = `
        <p><strong>Pojazd:</strong> ${escapeHtml(o.make)} ${escapeHtml(o.model)} (${escapeHtml(o.license_plate)})</p>
        <p><strong>Status:</strong> <span class="badge ${statusBadgeClass(o.status)}">${escapeHtml(o.status)}</span></p>
        <p><strong>Data:</strong> ${formatDate(o.created_at)}</p>

        <h4>Zadania</h4>
        <ul>${tasksHtml}</ul>
        <p style="text-align:right;">Suma zadań: <strong>${formatPrice(o.tasks_total)}</strong></p>

        <h4>Części</h4>
        <ul>${partsHtml}</ul>
        <p style="text-align:right;">Suma części: <strong>${formatPrice(o.parts_total)}</strong></p>

        <hr>
        <p style="text-align:right;font-size:18px;">DO ZAPŁATY: <strong>${formatPrice(o.total)}</strong></p>
    `;
    showDetailsModal(`Zlecenie #${orderId}`, html);
}

function renderInvoices() {
    if (!clientData) return;
    const tbody = document.getElementById('invoicesTableBody');
    if (!clientData.invoices.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Brak faktur</td></tr>';
        return;
    }
    tbody.innerHTML = clientData.invoices.map(inv => `
        <tr>
            <td><strong>${escapeHtml(inv.invoice_number)}</strong></td>
            <td>${escapeHtml(inv.make || '')} ${escapeHtml(inv.model || '')} (${escapeHtml(inv.license_plate || '')})</td>
            <td>${formatPrice(inv.total)}</td>
            <td>${inv.paid
                ? '<span class="badge badge-success">Opłacona</span>'
                : '<span class="badge badge-warning">Do zapłaty</span>'}</td>
            <td>${formatDate(inv.issued_at)}</td>
            <td>
                <button class="btn btn-info btn-sm" onclick="showInvoice(${inv.id})">
                    <i class="fas fa-eye"></i> Pokaż
                </button>
            </td>
        </tr>
    `).join('');
}

async function showInvoice(invoiceId) {
    try {
        const res = await api.getInvoice(invoiceId);
        const inv = res.data;
        showDetailsModal(`Faktura ${inv.invoice_number}`, renderInvoiceFullHtml(inv, { canMarkPaid: false }));
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

function renderInvoiceModal(inv) {
    showDetailsModal(`Faktura ${inv.invoice_number}`, renderInvoiceFullHtml(inv, { canMarkPaid: false }));
}

document.addEventListener('DOMContentLoaded', loadAll);
