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
        const res = await fetch('http://localhost:5000/products');
        
        if (!res.ok) {
            if (res.status === 0 || res.status >= 500) {
                if (retryCount < MAX_RETRIES) {
                    console.log(`Backend not ready, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
                    isLoading = false;
                    setTimeout(() => loadProducts(retryCount + 1), RETRY_DELAY);
                    return;
                }
            }
            
            const errorText = await res.text().catch(() => 'Unknown error');
            console.error('Failed to load products:', res.status, errorText);
            listContainer.innerHTML = '<p>Błąd pobierania danych. Sprawdź czy backend działa.</p>';
            isLoading = false;
            return;
        }
        
        products = await res.json();
        
        if (!Array.isArray(products)) {
            console.error('Invalid response format:', products);
            products = [];
        }
        
        renderProducts();
        isLoading = false;
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            console.log(`Connection error, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            isLoading = false;
            setTimeout(() => loadProducts(retryCount + 1), RETRY_DELAY);
            return;
        }
        
        console.error('Error loading products:', error);
        listContainer.innerHTML = '<p>Błąd połączenia z backendem. Sprawdź czy backend działa na porcie 5000.</p>';
        isLoading = false;
    }
}

function renderProducts() {
    if (!products || products.length === 0) {
        listContainer.innerHTML = '<p>Brak produktów. Dodaj pierwszy produkt używając formularza powyżej.</p>';
        return;
    }
    
    const filter = document.querySelector('input[name="filter"]:checked')?.value || 'all';

    let filtered = products;

    if (filter === 'withDate') {
        filtered = products.filter(p => p.expiry_date);
    }

    if (filter === 'withoutDate') {
        filtered = products.filter(p => !p.expiry_date);
    }

    filtered.sort((a, b) => {
        if (!a.expiry_date && !b.expiry_date) return 0;
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date) - new Date(b.expiry_date);
    });

    listContainer.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Nazwa</th>
                    <th>Ilość</th>
                    <th>Jednostka</th>
                    <th>Data ważności</th>
                    <th>Akcje</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(p => `
                    <tr>
                        <td>${p.name || '-'}</td>
                        <td>${p.quantity || 0}</td>
                        <td>${p.unit || '-'}</td>
                        <td>${p.expiry_date || '-'}</td>
                        <td>
                            <button onclick="editProduct(${p.id})">Edytuj</button>
                            <button onclick="deleteProduct(${p.id})">Usuń</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function deleteProduct(id) {
    if (!confirm('Czy na pewno chcesz usunąć ten produkt?')) {
        return;
    }
    
    try {
        const res = await fetch(`http://localhost:5000/products/${id}`, {
            method: 'DELETE'
        });
        
        if (!res.ok) {
            const errorText = await res.text().catch(() => 'Unknown error');
            console.error('Failed to delete product:', res.status, errorText);
            alert('Błąd podczas usuwania produktu.');
            return;
        }
        
        loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Błąd połączenia z backendem.');
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => loadProducts(), 500);
    });
} else {
    setTimeout(() => loadProducts(), 500);
}
