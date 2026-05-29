/**
 * Panel magazyniera — pełne podpięcie do api/*.php.
 *
 * Funkcje:
 *  - statystyki magazynu (Dashboard),
 *  - lista i wyszukiwanie części,
 *  - dodawanie nowej części, odbiór dostawy (zwiększanie stanu),
 *  - lista zgłoszeń od mechaników (filtry status / typ),
 *  - zmiana statusu zgłoszenia.
 */

let partsCache = [];

// ---------- Nawigacja ----------
function showDashboard() {
    showSection('dashboardSection');
    setActiveNav('navDashboard');
    document.getElementById('pageTitle').textContent = 'Dashboard';
    loadDashboard();
}
function showParts() {
    showSection('partsSection');
    setActiveNav('navParts');
    document.getElementById('pageTitle').textContent = 'Magazyn części';
    loadParts();
}
function showRequests() {
    showSection('requestsSection');
    setActiveNav('navRequests');
    document.getElementById('pageTitle').textContent = 'Zgłoszenia mechaników';
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
        document.getElementById('statTotalParts').textContent  = s.totalParts ?? 0;
        document.getElementById('statLowStock').textContent    = s.lowStock   ?? 0;
        document.getElementById('statNewRequests').textContent = s.newRequests?? 0;
        document.getElementById('statReadyParts').textContent  = s.readyParts ?? 0;
    } catch (err) {
        showNotification('Błąd statystyk: ' + err.message, 'error');
    }
}

// ---------- Magazyn części ----------
async function loadParts() {
    const search = document.getElementById('partsSearchInput').value.trim();
    const tbody = document.getElementById('partsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Ładowanie…</td></tr>';

    try {
        const res = await api.listParts(search);
        partsCache = res.data || [];
        if (!partsCache.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Brak części</td></tr>';
            return;
        }
        tbody.innerHTML = partsCache.map(p => {
            let badge = 'OK', cls = 'badge-success';
            if (p.quantity === 0)        { badge = 'Brak';      cls = 'badge-danger'; }
            else if (p.quantity < 5)     { badge = 'Krytyczny'; cls = 'badge-danger'; }
            else if (p.quantity < 10)    { badge = 'Niski';     cls = 'badge-warning'; }

            return `
                <tr style="cursor:pointer;" onclick="receiveDeliveryForPart(${p.id})">
                    <td>${p.id}</td>
                    <td>${escapeHtml(p.name)}</td>
                    <td>${p.price.toFixed(2)}</td>
                    <td>${p.quantity}</td>
                    <td><span class="badge ${cls}">${badge}</span></td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#e74c3c;">Błąd: ${escapeHtml(err.message)}</td></tr>`;
    }
}

async function receiveDeliveryForPart(partId) {
    const part = partsCache.find(p => p.id === partId);
    if (!part) return;

    const qtyStr = prompt(`Część: ${part.name}\nAktualnie na stanie: ${part.quantity} szt.\n\nIle sztuk dojechało?`);
    const qty = parseInt(qtyStr);
    if (!qty || qty <= 0) return;

    try {
        await api.addPartQuantity(partId, qty);
        showNotification(`Dodano ${qty} szt. do "${part.name}"`, 'success');
        loadParts();
        loadDashboard();
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

function receiveDelivery() {
    if (!partsCache.length) {
        showNotification('Najpierw załaduj listę części', 'error');
        return;
    }
    let listStr = 'Wybierz część (wpisz numer):\n\n';
    partsCache.forEach((p, i) => {
        listStr += `${i + 1}. ${p.name} (stan: ${p.quantity} szt.)\n`;
    });
    const idx = parseInt(prompt(listStr));
    if (idx >= 1 && idx <= partsCache.length) {
        receiveDeliveryForPart(partsCache[idx - 1].id);
    }
}

async function addNewPart() {
    const input = prompt('Podaj dane nowej części:\nNazwa, Cena, Ilość\n\nPrzykład: Filtr paliwa, 25.50, 10');
    if (!input) return;

    const parts = input.split(',').map(s => s.trim());
    if (parts.length !== 3) {
        showNotification('Błąd formatu! Wymagane: Nazwa, Cena, Ilość', 'error');
        return;
    }
    const [name, priceStr, qtyStr] = parts;
    const price = parseFloat(priceStr);
    const quantity = parseInt(qtyStr);

    if (!name || isNaN(price) || isNaN(quantity)) {
        showNotification('Niepoprawne dane', 'error');
        return;
    }

    try {
        await api.addPart({ name, price, quantity });
        showNotification(`Dodano część: ${name}`, 'success');
        loadParts();
        loadDashboard();
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

// ---------- Zgłoszenia mechaników ----------
async function loadRequests() {
    const tbody = document.getElementById('requestsTableBody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Ładowanie…</td></tr>';

    const status = document.getElementById('requestsStatusFilter').value;
    const type   = document.getElementById('requestsTypeFilter').value;

    const filters = {};
    if (status && status !== 'Wszystkie') filters.status = status;
    if (type   && type   !== 'Wszystkie') filters.type   = type;

    try {
        const res = await api.listRequests(filters);
        const rows = res.data || [];
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Brak zgłoszeń</td></tr>';
            return;
        }
        tbody.innerHTML = rows.map(r => {
            const mechanicName = `${r.mechanic_first_name || ''} ${r.mechanic_last_name || ''}`.trim() || (r.mechanic_login || 'Nieznany');
            const typeCls = r.type === 'W magazynie' ? 'badge-success' : 'badge-danger';
            const typeIcon = r.type === 'W magazynie' ? '✅' : '🛑';
            const statusCls =
                r.status === 'Gotowa do odbioru' ? 'badge-success' :
                r.status === 'Zamówiona'        ? 'badge-warning' : 'badge-secondary';
            return `
                <tr>
                    <td>${r.id}</td>
                    <td>${escapeHtml(mechanicName)}</td>
                    <td>${escapeHtml(r.part_name || '-')}</td>
                    <td>${r.quantity}</td>
                    <td><span class="badge ${typeCls}">${typeIcon} ${escapeHtml(r.type)}</span></td>
                    <td><span class="badge ${statusCls}">${escapeHtml(r.status)}</span></td>
                    <td>${formatDate(r.created_at)}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="changeRequestStatus(${r.id}, '${escapeHtml(r.status)}')">
                            <i class="fas fa-edit"></i> Zmień status
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#e74c3c;">Błąd: ${escapeHtml(err.message)}</td></tr>`;
    }
}

async function changeRequestStatus(reqId, currentStatus) {
    const statuses = ['Brak odpowiedzi', 'Zamówiona', 'Gotowa do odbioru'];
    let prompt_text = `Wybierz nowy status (aktualny: ${currentStatus}):\n\n`;
    statuses.forEach((s, i) => prompt_text += `${i + 1}. ${s}\n`);

    const idx = parseInt(prompt(prompt_text));
    if (!idx || idx < 1 || idx > statuses.length) return;

    try {
        await api.setRequestStatus(reqId, statuses[idx - 1]);
        showNotification(`Status: ${statuses[idx - 1]}`, 'success');
        loadRequests();
        loadDashboard();
    } catch (err) {
        showNotification('Błąd: ' + err.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    const search = document.getElementById('partsSearchInput');
    if (search) {
        let t;
        search.addEventListener('input', () => {
            clearTimeout(t);
            t = setTimeout(loadParts, 250);
        });
    }
});
