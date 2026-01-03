const listContainer = document.getElementById('product-list');
const filterRadios = document.querySelectorAll('input[name="filter"]');

let products = [];

async function loadProducts() {
    try {
        const res = await fetch('http://localhost:5000/products');
        products = await res.json();
        renderProducts();
    } catch {
        listContainer.innerHTML = '<p>Błąd pobierania danych.</p>';
    }
}

function renderProducts() {
    const filter = document.querySelector('input[name="filter"]:checked').value;

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
                        <td>${p.name}</td>
                        <td>${p.quantity}</td>
                        <td>${p.unit}</td>
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
    try {
        await fetch(`http://localhost:5000/products/${id}`, {
            method: 'DELETE'
        });
        loadProducts();
    } catch {}
}

function editProduct(id) {
}

filterRadios.forEach(r => r.addEventListener('change', renderProducts));

loadProducts();
