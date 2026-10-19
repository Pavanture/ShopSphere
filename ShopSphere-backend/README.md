# ShopSphere — E-Commerce Backend

A production-style e-commerce REST API built with **Java 21** and **Spring Boot**. ShopSphere implements user authentication, a product catalog, a shopping cart, and a transactional order pipeline, with JWT-based security, role-based authorization, global exception handling, and OpenAPI documentation.

> Built as a portfolio / interview-ready reference implementation of a layered Spring Boot backend.

---

## 1. Features

- **Authentication & Authorization** — JWT access tokens, BCrypt password hashing, `ROLE_USER` / `ROLE_ADMIN` role-based access control.
- **User profiles** — self-service view/update of the authenticated user's own account.
- **Product catalog** — CRUD (admin-only writes), pagination, keyword search, category filtering.
- **Categories** — CRUD (admin-only writes).
- **Shopping cart** — add/update/remove items, stock validation, subtotal & item-count calculation.
- **Addresses** — per-user shipping address book.
- **Orders** — atomic order placement from the cart (stock check → order + items → total → stock deduction → cart clear), order history, cancellation with stock restoration, admin order management.
- **Global exception handling** — consistent JSON error shape via `@RestControllerAdvice`.
- **Bean Validation** — all incoming DTOs validated with clear field-level messages.
- **OpenAPI / Swagger UI** — interactive API docs.
- **Unit & integration tests** — JUnit 5 + Mockito for services, MockMvc + H2 for authorization rules.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.3 |
| Web | Spring Web (MVC) |
| Persistence | Spring Data JPA + Hibernate |
| Security | Spring Security + JJWT (JWT) |
| Database | MySQL 8 (H2 in-memory for tests) |
| Build | Maven |
| Boilerplate reduction | Lombok |
| Validation | Jakarta Bean Validation |
| Docs | springdoc-openapi (Swagger UI) |
| Testing | JUnit 5, Mockito, Spring Security Test |

---

## 3. Architecture

Layered, package-by-responsibility structure:

```text
com.shopsphere
│
├── ShopSphereApplication.java     # Spring Boot entry point
│
├── config/            # Security, CORS, OpenAPI configuration
├── controller/         # Thin REST controllers (request/response only)
├── service/            # Business-logic interfaces
│   └── impl/           # Business-logic implementations
├── repository/          # Spring Data JPA repositories
├── entity/             # JPA entities
│   └── enums/           # Role, OrderStatus, PaymentStatus
├── dto/
│   ├── request/          # Inbound, validated request bodies
│   └── response/         # Outbound response shapes (never expose entities)
├── mapper/              # Entity <-> DTO conversion
├── security/            # JWT util, filter, UserDetails, entry point
├── exception/            # Custom exceptions + global handler
└── util/                # Cross-cutting helpers (SecurityUtils)
```

Controllers depend only on service interfaces; services depend only on repositories and mappers. Entities are never returned directly from any endpoint — every response goes through a DTO built by a mapper.

### Request flow

```
Client → Controller → Service (interface) → ServiceImpl → Repository → Database
                                    │
                                    ▼
                                 Mapper → DTO → Client
```

### Authentication flow

1. `POST /api/auth/register` or `/api/auth/login` → server validates credentials, issues a signed JWT (HS256) containing `sub` (email), `userId`, and `role`.
2. Client sends the token on every subsequent request: `Authorization: Bearer <token>`.
3. `JwtAuthenticationFilter` runs once per request, validates the token, loads the user, and populates Spring Security's `SecurityContext`.
4. `SecurityConfig` enforces route-level rules (public reads, authenticated writes, `ROLE_ADMIN`-only management endpoints).
5. Unauthenticated requests to protected routes get a consistent JSON 401 via `JwtAuthEntryPoint`; unauthorized (wrong role) requests get a JSON 403 via `GlobalExceptionHandler`.

---

## 4. Database Design

```text
User 1 ─── 1 Cart
Cart 1 ─── * CartItem
Product 1 ─── * CartItem

User 1 ─── * Order
Order 1 ─── * OrderItem
Product 1 ─── * OrderItem

Category 1 ─── * Product
User 1 ─── * Address
```

Key design decisions:

- **Order line-items snapshot price and product name at purchase time** (`OrderItem.priceAtPurchase`, `OrderItem.productName`), so later product price/name changes never retroactively alter historical orders.
- **Order shipping address is embedded as a snapshot** (`ShippingAddressSnapshot`, `@Embeddable`) rather than a live foreign key to `Address`, so editing or deleting an address book entry never mutates past orders.
- Unique constraints: `users.email`, `categories.name`, `(cart_id, product_id)` on `cart_items`.
- Indexes on `products.name`, `products.category_id`, and `orders.user_id` for common query patterns.
- `Cart` is a required 1:1 with `User`, created automatically at registration.
- Cascading: `Cart → CartItem` and `Order → OrderItem` cascade `ALL` with `orphanRemoval`, so removing a cart/order item is a simple collection operation.

Hibernate manages schema creation via `spring.jpa.hibernate.ddl-auto` (default `update`, safe for local development — use a real migration tool such as Flyway/Liquibase for production).

---

## 5. API Endpoints

All responses are wrapped in a consistent envelope:

```json
{ "success": true, "message": "Product fetched successfully", "data": { } }
```

Errors:

```json
{
  "timestamp": "2026-09-04T10:15:30",
  "status": 404,
  "message": "Product not found with id: 10",
  "path": "/api/products/10"
}
```

### Auth (`/api/auth`) — public

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account, returns a JWT |
| POST | `/api/auth/login` | Authenticate, returns a JWT |

### Users (`/api/users`) — authenticated

| Method | Path | Description |
|---|---|---|
| GET | `/api/users/me` | Get the current user's profile |
| PUT | `/api/users/me` | Update name / phone |

### Products (`/api/products`) — reads public, writes ADMIN

| Method | Path | Description |
|---|---|---|
| GET | `/api/products` | List/search, supports `keyword`, `categoryId`, `page`, `size`, `sortBy`, `direction` |
| GET | `/api/products/{id}` | Get one product |
| POST | `/api/products` | Create (ADMIN) |
| PUT | `/api/products/{id}` | Update (ADMIN) |
| DELETE | `/api/products/{id}` | Delete (ADMIN) |

### Categories (`/api/categories`) — reads public, writes ADMIN

| Method | Path | Description |
|---|---|---|
| GET | `/api/categories` | List all |
| GET | `/api/categories/{id}` | Get one |
| POST | `/api/categories` | Create (ADMIN) |
| PUT | `/api/categories/{id}` | Update (ADMIN) |
| DELETE | `/api/categories/{id}` | Delete (ADMIN) |

### Cart (`/api/cart`) — authenticated, own cart only

| Method | Path | Description |
|---|---|---|
| GET | `/api/cart` | Get the current user's cart |
| POST | `/api/cart/items` | Add a product (`productId`, `quantity`) |
| PUT | `/api/cart/items/{productId}` | Update quantity |
| DELETE | `/api/cart/items/{productId}` | Remove one product |
| DELETE | `/api/cart` | Clear the cart |

### Addresses (`/api/addresses`) — authenticated, own addresses only

| Method | Path | Description |
|---|---|---|
| GET | `/api/addresses` | List addresses |
| POST | `/api/addresses` | Add an address |
| PUT | `/api/addresses/{id}` | Update an address |
| DELETE | `/api/addresses/{id}` | Delete an address |

### Orders (`/api/orders`) — authenticated, own orders only

| Method | Path | Description |
|---|---|---|
| POST | `/api/orders` | Place an order from the current cart (`addressId`) |
| GET | `/api/orders` | List the current user's orders (paginated) |
| GET | `/api/orders/{id}` | Get one of the current user's orders |
| PUT | `/api/orders/{id}/cancel` | Cancel an order (restocks items) |

### Admin Orders (`/api/admin/orders`) — ADMIN only

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/orders` | List all orders (paginated) |
| GET | `/api/admin/orders/{id}` | Get any order |
| PUT | `/api/admin/orders/{id}/status` | Update `orderStatus` / `paymentStatus` |

Full interactive documentation: **`GET /swagger-ui.html`** once the app is running.

---

## 6. Order Placement Flow (Business Logic)

`POST /api/orders` runs inside a single `@Transactional` boundary:

1. Load the user's cart; reject if empty.
2. Load and validate the chosen shipping address belongs to the user.
3. Validate stock for **every** cart line before mutating anything.
4. Create the `Order` and snapshot the shipping address.
5. Create `OrderItem`s, snapshotting product name & price, and accumulate the total.
6. Decrement product stock for each item.
7. Clear the user's cart.
8. Persist everything atomically — if any step fails, the whole transaction rolls back.

Cancelling an order (`PUT /api/orders/{id}/cancel`) restores stock for each item and is blocked once the order has shipped or delivered.

---

## Deploying on Vercel with Clever Cloud MySQL

You can keep a MySQL database you already have on Clever Cloud and connect the Vercel-hosted Spring Boot API to it, provided that the database add-on allows external connections from Vercel. Vercel's Container Runtime is currently in beta. This project includes `Dockerfile.vercel` for deploying the API as a Vercel container. Check Vercel's current container limits and pricing before using this beta runtime for production.

### 1. Check the Clever Cloud MySQL add-on

In the Clever Cloud console, open the existing MySQL add-on and find the connection details: host, port, database name, username, and password. The Clever Cloud MySQL DEV plan is described as free for testing and has lower performance and no backups/extensions/SLA. Check the add-on's plan and verify that its hostname and port accept external connections from Vercel; don't assume an internal/private hostname is reachable there. Prefer a dedicated database/schema for ShopSphere so it doesn't share tables with your other project.

### 2. Deploy the backend to Vercel

Create a Vercel project from this Git repository and set its **Root Directory** to `ShopSphere-backend`. Vercel should detect `Dockerfile.vercel` and use the Container Runtime. Add these project environment variables in Vercel for every environment you deploy:

| Variable | Value |
|---|---|
| `DB_HOST` | Clever Cloud MySQL add-on host |
| `DB_PORT` | Clever Cloud MySQL add-on port |
| `DB_NAME` | Database name shown by Clever Cloud |
| `DB_USERNAME` | Clever Cloud MySQL username |
| `DB_PASSWORD` | Clever Cloud MySQL password |
| `JWT_SECRET` | A newly generated, private random secret of at least 256 bits |
| `CORS_ALLOWED_ORIGINS` | Exact Vercel frontend origin, for example `https://your-store.vercel.app` |
| `DDL_AUTO` | `update` |

Do not include `/api` in `CORS_ALLOWED_ORIGINS`. Set secrets in Vercel's environment-variable settings, not in source files. Deploy, then check the backend URL at `/v3/api-docs` or `/swagger-ui.html`.

### 3. Deploy the frontend to Vercel

Create a second Vercel project for the same repository and set its **Root Directory** to `ShopSphere-frontend`. After the backend has deployed, replace the local API URL in `index.html` with the backend deployment URL plus `/api`, for example:

```js
window.SHOPSPHERE_API_BASE = 'https://your-api.vercel.app/api';
```

Redeploy the frontend. Set the resulting frontend origin as `CORS_ALLOWED_ORIGINS` in the backend project and redeploy the backend if necessary. The API and frontend use different Vercel project URLs, so the backend must explicitly allow the frontend origin.

### Important limitations

- Vercel's Container Runtime is beta and can scale to zero between requests; the first request after inactivity can be slow while Spring Boot starts.
- Clever Cloud's MySQL DEV plan is intended for testing and has no backups or SLA. Verify its current terms, quotas, and external connectivity in the Clever Cloud console before relying on it.
- Pointing ShopSphere at a database with another application's schema may create ShopSphere tables there (`DDL_AUTO=update`). Back up the database and use a separate database/schema where possible.

---

## 7. Setup Instructions

### Prerequisites

- Java 21 (JDK)
- Maven 3.9+
- MySQL 8.x running locally or reachable

### 1. Clone / unzip the project

```bash
cd shopsphere
```

### 2. Create the database (optional — the app can auto-create it)

```sql
CREATE DATABASE shopsphere_db;
```

### 3. Configure environment variables

Copy `.env.example` to `.env` (or export the variables in your shell / IDE run config):

```bash
cp .env.example .env
```

```text
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopsphere_db
DB_USERNAME=root
DB_PASSWORD=your-db-password

JWT_SECRET=replace-with-a-long-random-base64-secret-at-least-256-bits
JWT_EXPIRATION=86400000

CORS_ALLOWED_ORIGINS=http://localhost:3000

QIKINK_ENABLED=false
QIKINK_BASE_URL=https://sandbox.qikink.com
QIKINK_CLIENT_ID=
QIKINK_CLIENT_SECRET=
QIKINK_GATEWAY=COD
QIKINK_SHIPPING=1
```

> Never commit real secrets. `JWT_SECRET` should be a long, random value in any real deployment — generate one with `openssl rand -base64 48`.

### 4. Build

```bash
mvn clean install
```

### 5. Run

```bash
mvn spring-boot:run
```

or run the packaged jar:

```bash
java -jar target/shopsphere.jar
```

The API is now available at `http://localhost:8080`, and Swagger UI at `http://localhost:8080/swagger-ui.html`.

### 6. Run tests

```bash
mvn test
```

Tests run against an in-memory H2 database (see `application-test.yml`) and do not require MySQL.

---

## 8. Environment Variables Reference

| Variable | Purpose | Example |
|---|---|---|
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `shopsphere_db` |
| `DB_USERNAME` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | *(secret)* |
| `JWT_SECRET` | HMAC signing key for JWTs | *(secret, ≥256 bits)* |
| `JWT_EXPIRATION` | Access token lifetime, ms | `86400000` (24h) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |
| `SERVER_PORT` | HTTP port | `8080` |
| `DDL_AUTO` | Hibernate schema strategy | `update` |
| `QIKINK_ENABLED` | Submit committed orders to Qikink | `false` |
| `QIKINK_BASE_URL` | Qikink API host (sandbox by default) | `https://sandbox.qikink.com` |
| `QIKINK_CLIENT_ID` | Qikink API client ID | *(secret/config)* |
| `QIKINK_CLIENT_SECRET` | Qikink API client secret | *(secret)* |
| `QIKINK_GATEWAY` | Qikink payment type | `COD` or `Prepaid` |
| `QIKINK_SHIPPING` | Qikink handles shipping (`1`) or self-shipping (`0`) | `1` |

### Qikink order fulfillment

The catalog remains in ShopSphere. Add the matching SKU from Qikink **My Products** to each ShopSphere product in Admin. Qikink catalog import is not available in the documented Open API. When `QIKINK_ENABLED=true`, a committed ShopSphere order is submitted to Qikink using `search_from_my_products=1`; the Qikink order ID and submission status are saved on the local order. Submission failures are recorded without undoing the customer's ShopSphere order.

Products can have colour/size variants. Add one Admin variant row per sellable colour/size combination with its public image URL, available stock, and matching Qikink My Products SKU. The chosen variant and its SKU are carried through cart, order, and Qikink fulfillment. Qikink catalog import is not available in the documented Open API. Keep the client secret in environment variables and use the sandbox host for testing.

Hibernate creates the variant table and new cart index on startup. On an existing MySQL database, run `src/main/resources/db/manual/20261002_allow_cart_variants.sql` once after restarting the backend to remove the legacy unique index on `(cart_id, product_id)`. This keeps existing cart rows and allows multiple variants of the same product in one cart.

For PowerShell, set the variables in the same terminal before starting Spring Boot (a `.env` file by itself is not automatically loaded):

```powershell
$env:QIKINK_ENABLED = 'true'
$env:QIKINK_BASE_URL = 'https://sandbox.qikink.com'
$env:QIKINK_CLIENT_ID = '<your sandbox client ID>'
$env:QIKINK_CLIENT_SECRET = '<your sandbox client secret>'
$env:QIKINK_GATEWAY = 'COD'
mvn spring-boot:run
```

Use equivalent environment variables in the IDE run configuration. Keep real credentials out of source control and chat.

---

## 9. Sample Requests

### Register

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePass123",
    "phone": "9876543210"
  }'
```

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "jane@example.com", "password": "SecurePass123" }'
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresInMs": 86400000,
    "user": { "id": 1, "name": "Jane Doe", "email": "jane@example.com", "role": "ROLE_USER" }
  }
}
```

### Add a product to the cart (authenticated)

```bash
curl -X POST http://localhost:8080/api/cart/items \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "productId": 1, "quantity": 2 }'
```

### Place an order

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "addressId": 1 }'
```

---

## 10. Test / Development Credentials

No accounts are seeded by default. Create your own via `/api/auth/register`; the first `ROLE_ADMIN` user must be promoted manually, e.g.:

```sql
UPDATE users SET role = 'ROLE_ADMIN' WHERE email = 'admin@example.com';
```

For local development only, you might use:

```text
Email:    admin@example.com
Password: AdminPass123!
```

**Do not reuse these values anywhere real** — they exist purely as a placeholder for local testing.

---

## 11. Notes on Production Readiness

This project follows production patterns (DTOs, layered architecture, transactional integrity, centralized error handling, externalized secrets), but a few things to add before a real deployment:

- Schema migrations via Flyway or Liquibase instead of `ddl-auto: update`.
- Refresh tokens / token revocation if long-lived sessions are needed.
- Rate limiting on `/api/auth/**`.
- Centralized structured logging / tracing (e.g. ELK, OpenTelemetry).
- A real payment gateway integration behind `paymentStatus`.
- CI pipeline running `mvn verify` on every push.

---

## 12. License

Provided as-is for portfolio and educational purposes.
