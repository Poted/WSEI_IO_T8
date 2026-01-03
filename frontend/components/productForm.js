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
        const res = await fetch('http://localhost:5000/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            showFormMessage('Błąd podczas dodawania produktu.');
            return;
        }

        showFormMessage('Dodano produkt.');
        e.target.reset();

        if (typeof loadProducts === 'function') loadProducts();

    } catch {
        showFormMessage('Błąd połączenia z backendem.');
    }
}

function showFormMessage(msg) {
    document.getElementById('form-message').textContent = msg;
}

renderProductForm();
