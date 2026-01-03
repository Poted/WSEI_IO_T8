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

### Backend
1. Open the `backend/` folder in Visual Studio or VS Code.
2. Run the ASP.NET project (`dotnet run`).
3. API available at: `http://localhost:5000`.

### Frontend
1. Open `frontend/index.html` in a browser.
2. The application works locally without a server.

## API Endpoints
- `GET /products` – list products  
- `POST /products` – add product  
- `PUT /products/{id}` – update product  
- `DELETE /products/{id}` – delete product  

## Sanity Test
1. Start backend  
2. Open frontend  
3. Add a product  
4. Verify it appears in the list  
5. Delete the product  
6. Verify it is removed  

---

If you want, I can also prepare a shorter version, a more formal academic version, or a version with sections tailored to your assignment requirements.
