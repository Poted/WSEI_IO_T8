const formContainer = document.getElementById('form-container');

function renderProductForm() {
    formContainer.innerHTML = `
        <form id="product-form">
            <input type="text" id="name" placeholder="Nazwa produktu" required>
            <input type="number" id="quantity" placeholder="Ilość" min="1" required>

            <select id="unit" required>
                <option value="">Jednostka</option>
                <option value="szt">szt</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
            </select>

            <input type="date" id="expiry_date">

            <button type="submit">Dodaj produkt</button>
        </form>

        <p id="form-message"></p>
    `;

    const form = document.getElementById('product-form');
    form.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const unit = document.getElementById('unit').value;
    const expiry_date = document.getElementById('expiry_date').value || null;

    if (!name || quantity <= 0 || !unit) {
        showFormMessage('Wypełnij poprawnie wszystkie pola.');
        return;
    }

    const payload = { name, quantity, unit, expiry_date };

    try {
        // Check if we're editing (editingProductId is set in productList.js)
        const isEditing = window.editingProductId !== null && window.editingProductId !== undefined;
        
        let result;
        if (isEditing) {
            result = await window.apiService.updateProduct(window.editingProductId, payload);
        } else {
            result = await window.apiService.createProduct(payload);
        }

        if (!result) {
            showFormMessage(isEditing ? 'Błąd podczas aktualizacji produktu.' : 'Błąd podczas dodawania produktu.');
            return;
        }

        const isOffline = !window.apiService.isOnline;
        const offlineMsg = isOffline ? ' (tryb offline - zostanie zsynchronizowane po przywróceniu połączenia)' : '';
        showFormMessage(isEditing ? `Zaktualizowano produkt.${offlineMsg}` : `Dodano produkt.${offlineMsg}`);
        e.target.reset();

        // Reset editing state
        window.editingProductId = null;

        // Reset button text
        const submitButton = document.querySelector('#product-form button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Dodaj produkt';
        }

        if (typeof loadProducts === 'function') loadProducts();
        if (typeof updateOnlineStatus === 'function') updateOnlineStatus();

    } catch (error) {
        console.error('Error submitting form:', error);
        const isOffline = !window.apiService.isOnline;
        showFormMessage(isOffline 
            ? 'Zapisano lokalnie (tryb offline). Zmiany zostaną zsynchronizowane po przywróceniu połączenia.'
            : 'Błąd podczas przetwarzania żądania.');
    }
}

function showFormMessage(msg) {
    document.getElementById('form-message').textContent = msg;
}

renderProductForm();
