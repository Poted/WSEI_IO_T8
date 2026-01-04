# Grocery Shopping Support Application (MVP)

A simple local application for managing a shopping list and tracking product expiration dates. Built as part of a university software engineering project.

External docs can be found [here](https://docs.google.com/document/d/1l_IFdjA_0j8zvD7kqhsP0ATludDz1pBtWiLlzNeazMk)

## Team
- [Piotr Siwek](https://github.com/Poted) – Frontend (UI, forms, product list)
- [Marcin Ruszaj](https://github.com/mruszaj) – Backend (expiration dates, sorting, offline mode)
- [Filip Kowal](https://github.com/F-Kowal) – Backend (CRUD, SQLite, API)

## Overview
The goal of the application is to help users plan grocery shopping and manage household supplies. The system allows adding products, tracking quantities, storing expiration dates, and viewing items in a clear list. All data is stored locally using SQLite. No login or cloud features are required.

## Features
### Core (MVP)
- Add products (name, quantity, unit, optional expiration date)
- Edit and delete products
- Sort products by expiration date
- Filter products (with date / without date)
- Local SQLite database
- Offline mode
- Minimal, clear user interface

### Extended (non‑MVP)
- Simple recipes with ingredients
- Adding ingredients from a recipe to the shopping list
- Basic product catalog with units and categories

## Technology Stack
**Backend:** C#, ASP.NET, SQLite  
**Frontend:** HTML, CSS, JavaScript

## Project Structure
```
WSEI_IO_T8/
├── backend/
│   ├── T8.slnx
│   └── T8/
└── frontend/
    ├── index.html
    ├── style.css
    ├── app.js
    └── components/
        ├── productForm.js
        └── productList.js
```

## Running the Application

### Prerequisites
- .NET 10.0 SDK installed
- A modern web browser (Chrome, Firefox, Edge, etc.)

### Quick Start (Recommended)
1. Navigate to the project root directory
2. Run: `npm run dev` (or `node run.js`)
   - This will start the backend server and open the frontend in your browser

### Manual Start

#### Backend
1. Navigate to `backend/T8/` directory
2. Run: `dotnet run`
3. The API will be available at: `http://localhost:5000`
4. **Swagger UI** is available at: `http://localhost:5000/swagger` 
5. **OpenAPI JSON** is available at: `http://localhost:5000/openapi/v1.json` - Raw OpenAPI specification
6. The SQLite database (`products.db`) will be automatically created in the `backend/T8/` directory

#### Frontend
**Option 1: Direct file (requires backend running)**
1. Open `frontend/index.html` directly in your browser (file:// protocol)
2. The frontend will connect to the backend API

**Option 2: Via backend (recommended)**
1. With the backend running, navigate to `http://localhost:5000` in the browser
2. The backend serves the frontend files automatically

## API Testing with Swagger

**Swagger UI** provides an interactive interface to test all API endpoints directly from your browser:

1. Start the backend server: `cd backend/T8 && dotnet run`
2. Navigate to: `http://localhost:5000/swagger` in your browser
3. You can now:
   - View all available endpoints (GET, POST, PUT, DELETE)
   - Test each endpoint directly in the browser
   - See request/response schemas
   - Execute API calls and see responses in real-time
   - Test with different request bodies and parameters

This is useful for testing the backend without using the frontend interface. The Swagger UI loads the OpenAPI specification from `/openapi/v1.json` which is automatically generated from controllers.

## API Endpoints

All endpoints are available at `http://localhost:5000/products`

- `GET /products` – Get all products (sorted by expiration date)
- `GET /products/{id}` – Get a specific product by ID
- `POST /products` – Create a new product
  ```json
  {
    "name": "Milk",
    "quantity": 2,
    "unit": "l",
    "expiry_date": "2024-12-31"
  }
  ```
- `PUT /products/{id}` – Update an existing product
- `DELETE /products/{id}` – Delete a product

## Testing the Application

### Basic Functionality Test
1. **Start the backend**: `cd backend/T8 && dotnet run`
2. **Open the frontend**: Open `frontend/index.html` in the browser or navigate to `http://localhost:5000`
3. **Add a product**:
   - Fill in: Name (e.g., "Milk"), Quantity (e.g., 2), Unit (e.g., "l")
   - Optionally add an expiration date
   - Click "Dodaj produkt"
   - Verify the product appears in the list
4. **Edit a product**:
   - Click "Edytuj" on any product
   - Modify the fields in the form
   - Click "Zaktualizuj produkt"
   - Verify changes are reflected in the list
5. **Delete a product**:
   - Click "Usuń" on any product
   - Verify the product is removed from the list
6. **Filter products**:
   - Use radio buttons to filter: "Wszystkie", "Z datą", "Bez daty"
   - Verify filtering works correctly
7. **Sort by expiration date**:
   - Add multiple products with different expiration dates
   - Verify products are sorted by expiration date (earliest first)

### Database Test
1. Stop the backend
2. Check that `backend/T8/products.db` file exists
3. Restart the backend
4. Verify all previously added products are still present (data persistence)

### Offline Mode Test
1. Start the backend and add some products
2. Stop the backend server
3. The frontend will show connection errors when trying to load/save
4. Restart the backend
5. Verify data is still intact (SQLite database persists locally)

## Database

The application uses SQLite for local data storage:
- Database file: `backend/T8/products.db`
- Automatically created on first run
- Data persists between application restarts
- No external database server required (offline-capable)  

---

