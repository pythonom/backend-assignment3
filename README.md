# Inventory and Data Management System

Web Dev III - Assignment 3.

## 1. Requirements

- Node.js installed
- MongoDB running locally, or a MongoDB Atlas connection string

## 2. Setup

```bash
npm install
```

Copy `.env.example` to `.env` and configure `MONGO_URI`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/inventory_db
```

Start the server:

```bash
npm start
```

Open `http://localhost:5000` to check the API.

## 3. API endpoints

| Method | Endpoint                                 | Purpose                         |
| ------ | ---------------------------------------- | ------------------------------- |
| POST   | `/api/products`                          | Create a product                |
| GET    | `/api/products`                          | List, filter, sort and paginate |
| GET    | `/api/products/:id`                      | Get one product                 |
| PUT    | `/api/products/:id`                      | Update product details          |
| PATCH  | `/api/products/:id/stock`                | Restock or record a sale        |
| DELETE | `/api/products/:id`                      | Delete product                  |
| GET    | `/api/products/reports/low-stock`        | Low-stock report                |
| GET    | `/api/products/reports/category-summary` | Category aggregation            |
