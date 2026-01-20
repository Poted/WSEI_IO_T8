const listContainer = document.getElementById('product-list');
const filterRadios = document.querySelectorAll('input[name="filter"]');

let products = [];
let isLoading = false;
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

function showLoading() {
    listContainer.innerHTML = '<p>Ładowanie produktów...</p>';
}

async function loadProducts(retryCount = 0) {
    if (isLoading) return;
    
    isLoading = true;
    showLoading();
    
    try {
        // Use API service (supports offline mode)
        products = await window.apiService.getProducts();
        
        if (!Array.isArray(products)) {
            console.error('Invalid response format:', products);
            products = [];
        }
        
        renderProducts();
        updateOnlineStatus();
        isLoading = false;
    } catch (error) {
        console.error('Error loading products:', error);
        // Even on error, try to show local storage data
        products = window.localStorageService.getProducts();
        renderProducts();
        updateOnlineStatus();
        isLoading = false;
    }
}

function updateOnlineStatus() {
    const statusEl = document.getElementById('online-status');
    if (statusEl) {
        statusEl.textContent = window.apiService.isOnline 
            ? '🟢 Online' 
            : '🔴 Offline (tryb lokalny)';
        statusEl.style.color = window.apiService.isOnline ? 'green' : 'orange';
    }
}

function getExpiryStatus(expiryDate) {
    if (!expiryDate) return { status: 'none', icon: '', class: '' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
        return { status: 'expired', icon: '⚠️', class: 'expired', days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry === 0) {
        return { status: 'today', icon: '🔴', class: 'expiring-today', days: 0 };
    } else if (daysUntilExpiry <= 7) {
        return { status: 'soon', icon: '🔴', class: 'expiring-soon', days: daysUntilExpiry };
    } else if (daysUntilExpiry <= 30) {
        return { status: 'month', icon: '🟡', class: 'expiring-month', days: daysUntilExpiry };
    } else {
        return { status: 'valid', icon: '✅', class: 'valid', days: daysUntilExpiry };
    }
}

function renderProducts() {
    if (!products || products.length === 0) {
        listContainer.innerHTML = '<p>Brak produktów. Dodaj pierwszy produkt używając formularza powyżej.</p>';
        return;
    }
    
    const filter = document.querySelector('input[name="filter"]:checked')?.value || 'all';
    const sortOrder = document.querySelector('input[name="sortOrder"]:checked')?.value || 'asc';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = products;

    // Apply filtering
    switch (filter) {
        case 'withDate':
            filtered = products.filter(p => p.expiry_date);
            break;
        case 'withoutDate':
            filtered = products.filter(p => !p.expiry_date);
            break;
        case 'expired':
            filtered = products.filter(p => {
                if (!p.expiry_date) return false;
                const expiry = new Date(p.expiry_date);
                expiry.setHours(0, 0, 0, 0);
                return expiry < today;
            });
            break;
        case 'expiringSoon':
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            filtered = products.filter(p => {
                if (!p.expiry_date) return false;
                const expiry = new Date(p.expiry_date);
                expiry.setHours(0, 0, 0, 0);
                return expiry >= today && expiry <= nextWeek;
            });
            break;
        case 'expiringThisMonth':
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            filtered = products.filter(p => {
                if (!p.expiry_date) return false;
                const expiry = new Date(p.expiry_date);
                expiry.setHours(0, 0, 0, 0);
                return expiry >= today && expiry <= endOfMonth;
            });
            break;
        case 'valid':
            filtered = products.filter(p => {
                if (!p.expiry_date) return true;
                const expiry = new Date(p.expiry_date);
                expiry.setHours(0, 0, 0, 0);
                return expiry >= today;
            });
            break;
        case 'all':
        default:
            filtered = products;
            break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
        const aDate = a.expiry_date ? new Date(a.expiry_date) : null;
        const bDate = b.expiry_date ? new Date(b.expiry_date) : null;
        
        if (sortOrder === 'desc') {
            // Descending: latest first, null dates first
            if (!aDate && !bDate) return 0;
            if (!aDate) return -1;
            if (!bDate) return 1;
            return bDate - aDate;
        } else {
            // Ascending: earliest first, null dates last
            if (!aDate && !bDate) return 0;
            if (!aDate) return 1;
            if (!bDate) return -1;
            return aDate - bDate;
        }
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = '<p>Brak produktów spełniających wybrane kryteria filtrowania.</p>';
        return;
    }

    listContainer.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Nazwa</th>
                    <th>Ilość</th>
                    <th>Jednostka</th>
                    <th>Data ważności</th>
                    <th>Status</th>
                    <th>Akcje</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(p => {
                    const expiryStatus = getExpiryStatus(p.expiry_date);
                    const statusText = expiryStatus.status === 'expired' 
                        ? `Przeterminowane (${expiryStatus.days} dni temu)`
                        : expiryStatus.status === 'today'
                        ? 'Wygasa dzisiaj!'
                        : expiryStatus.status === 'soon'
                        ? `Wygasa za ${expiryStatus.days} ${expiryStatus.days === 1 ? 'dzień' : 'dni'}`
                        : expiryStatus.status === 'month'
                        ? `Wygasa za ${expiryStatus.days} dni`
                        : expiryStatus.status === 'valid'
                        ? `Ważne jeszcze ${expiryStatus.days} dni`
                        : 'Bez daty';
                    
                    return `
                    <tr class="${expiryStatus.class}">
                        <td>${p.name || '-'} ${p._offline ? '🔴' : ''}</td>
                        <td>${p.quantity || 0}</td>
                        <td>${p.unit || '-'}</td>
                        <td>${p.expiry_date || '-'}</td>
                        <td><span class="status-badge">${expiryStatus.icon} ${statusText}</span></td>
                        <td>
                            <button onclick="editProduct(${p.id})">Edytuj</button>
                            <button onclick="deleteProduct(${p.id})">Usuń</button>
                        </td>
                    </tr>
                `;
                }).join('')}
            </tbody>
        </table>
    `;
}

async function deleteProduct(id) {
    if (!confirm('Czy na pewno chcesz usunąć ten produkt?')) {
        return;
    }
    
    try {
        const success = await window.apiService.deleteProduct(id);
        if (success) {
            loadProducts();
            updateOnlineStatus();
        } else {
            alert('Błąd podczas usuwania produktu.');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        // Still try to remove from local view
        products = products.filter(p => p.id !== id);
        renderProducts();
        updateOnlineStatus();
    }
}

window.editingProductId = null;

async function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) {
        console.error('Product not found with id:', id);
        alert('Nie znaleziono produktu do edycji.');
        return;
    }

    window.editingProductId = id;

    // Populate form with product data
    const nameInput = document.getElementById('name');
    const quantityInput = document.getElementById('quantity');
    const unitInput = document.getElementById('unit');
    const expiryDateInput = document.getElementById('expiry_date');

    if (!nameInput || !quantityInput || !unitInput || !expiryDateInput) {
        console.error('Form elements not found');
        alert('Błąd: Nie można znaleźć formularza. Odśwież stronę.');
        return;
    }

    nameInput.value = product.name || '';
    quantityInput.value = product.quantity || 1;
    unitInput.value = product.unit || '';
    expiryDateInput.value = product.expiry_date || '';

    const submitButton = document.querySelector('#product-form button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Zaktualizuj produkt';
    }

    const formSection = document.getElementById('form-section');
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
    }
}

filterRadios.forEach(r => r.addEventListener('change', renderProducts));

// Also listen for sort order changes
document.addEventListener('DOMContentLoaded', () => {
    const sortRadios = document.querySelectorAll('input[name="sortOrder"]');
    sortRadios.forEach(r => r.addEventListener('change', renderProducts));
});

// Listen for sort order changes after page load
const sortRadios = document.querySelectorAll('input[name="sortOrder"]');
sortRadios.forEach(r => r.addEventListener('change', renderProducts));

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => loadProducts(), 500);
    });
} else {
    setTimeout(() => loadProducts(), 500);
}
