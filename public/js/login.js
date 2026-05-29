/**
 * Logowanie — pracownik (login+hasło) lub klient (rejestracja+kod).
 */

function switchTab(tab) {
    document.querySelectorAll('.login-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('form[data-form]').forEach(f => {
        f.style.display = f.dataset.form === tab ? '' : 'none';
    });
    document.getElementById('employeeInfo').style.display = tab === 'employee' ? '' : 'none';
    document.getElementById('clientInfo').style.display   = tab === 'client'   ? '' : 'none';
    document.getElementById('errorMessage').style.display = 'none';
}

function showError(message) {
    const el = document.getElementById('errorMessage');
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// Logowanie pracownika
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const login    = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value;
    if (!login || !password) {
        showError('Wypełnij wszystkie pola!');
        return;
    }
    try {
        const res = await api.login(login, password);
        const user = res.data && res.data.user;
        if (!user) {
            showError('Niepoprawna odpowiedź serwera');
            return;
        }
        auth.setUser(user);
        switch (user.role) {
            case 'admin':      window.location.href = 'admin.html'; break;
            case 'mechanic':   window.location.href = 'mechanic.html'; break;
            case 'recepcja':   window.location.href = 'recepcja.html'; break;
            case 'magazynier': window.location.href = 'magazynier.html'; break;
            default:           showError('Nieznana rola użytkownika');
        }
    } catch (err) {
        showError(err.message || 'Błąd logowania');
    }
});

// Logowanie klienta
document.getElementById('clientLoginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const plate = document.getElementById('plate').value.trim().toUpperCase();
    const code  = document.getElementById('code').value.trim().toUpperCase();
    if (!plate || !code) {
        showError('Podaj numer rejestracyjny i kod dostępu!');
        return;
    }
    try {
        const res = await api.clientLogin(plate, code);
        const user = res.data && res.data.user;
        if (!user) {
            showError('Niepoprawna odpowiedź serwera');
            return;
        }
        auth.setUser(user);
        window.location.href = 'klient.html';
    } catch (err) {
        showError(err.message || 'Błąd logowania klienta');
    }
});
