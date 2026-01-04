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
        const url = isEditing 
            ? `http://localhost:5000/products/${window.editingProductId}`
            : 'http://localhost:5000/products';
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text().catch(() => 'Unknown error');
            console.error('Request failed:', res.status, errorText);
            showFormMessage(isEditing ? 'Błąd podczas aktualizacji produktu.' : 'Błąd podczas dodawania produktu.');
            return;
        }

        showFormMessage(isEditing ? 'Zaktualizowano produkt.' : 'Dodano produkt.');
        e.target.reset();

        // Reset editing state
        window.editingProductId = null;

        // Reset button text
        const submitButton = document.querySelector('#product-form button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Dodaj produkt';
        }

        if (typeof loadProducts === 'function') loadProducts();

    } catch (error) {
        console.error('Error submitting form:', error);
        showFormMessage('Błąd połączenia z backendem. Sprawdź czy backend działa na porcie 5000.');
    }
}

function showFormMessage(msg) {
    document.getElementById('form-message').textContent = msg;
}

renderProductForm();
