# ShopSphere Frontend

A plain HTML/CSS/JavaScript (ES modules, no build step, no framework) frontend for the ShopSphere Spring Boot backend. Covers registration/login, product browsing & search, cart, checkout, addresses, order history, and an admin panel for products/categories/orders.

## Why no framework?

Zero install, zero build step — unzip and serve. It talks to the backend purely over its REST API (`fetch` + JWT in `Authorization: Bearer ...`), the same way any frontend framework would.

## 1. Run the backend first

Start the ShopSphere Spring Boot API (see the backend's own README) so it's listening on `http://localhost:8080`.

## 2. Serve this folder

Browsers block ES module imports (and the backend's CORS is origin-based) when opened directly as a `file://` path, so serve it over HTTP. The backend's default CORS setting (`CORS_ALLOWED_ORIGINS`) allows `http://localhost:3000` — pick **one** of these to serve on port 3000:

**Node (no install needed, via npx):**
```bash
npx serve -l 3000
```

**Python 3:**
```bash
python -m http.server 3000
```

**VS Code:** install the "Live Server" extension and set its port to 3000 in settings, then "Open with Live Server".

Then open **http://localhost:3000** in your browser.

> Using a different port? Set the backend's `CORS_ALLOWED_ORIGINS` environment variable to the frontend's exact origin (for example, `http://localhost:5500`) and restart the backend. Spring Boot does not load `.env` files automatically; set this variable in your shell or IDE run configuration.

## 3. Point it at a different backend (optional)

If your API isn't on `http://localhost:8080/api`, edit the inline script in `index.html`:

```html
<script>
  window.SHOPSPHERE_API_BASE = 'http://localhost:8080/api';
</script>
```

## Deploying on Vercel

Create a Vercel project from the repository and set its **Root Directory** to `ShopSphere-frontend`. This frontend is static HTML/CSS/JavaScript and needs no build command. After deploying the backend, set `window.SHOPSPHERE_API_BASE` in `index.html` to the backend's public URL followed by `/api`, then redeploy the frontend. Set the backend's `CORS_ALLOWED_ORIGINS` to the exact deployed frontend origin. See the backend README for deploying the API with the Vercel Container Runtime and configuring Clever Cloud MySQL.

## Project structure

```text
shopsphere-frontend/
├── index.html
├── css/
│   └── styles.css          # design tokens + all styles
└── js/
    ├── app.js               # hash router + bootstrap
    ├── api.js                # fetch wrapper, one method per backend endpoint
    ├── state.js               # auth/session state (localStorage-backed)
    ├── layout.js               # header/nav, cart badge
    ├── helpers.js               # toast, formatting, small DOM utilities
    ├── components/
    │   ├── addressModal.js        # shared add/edit address modal
    │   ├── productModal.js         # admin add/edit product modal
    │   └── categoryModal.js         # admin add/edit category modal
    └── pages/
        ├── home.js            # product shelf: search, category filter, pagination
        ├── product.js           # product detail + add to cart
        ├── auth.js               # login + register
        ├── cart.js                 # view/update/remove cart items
        ├── checkout.js              # pick address, place order
        ├── addresses.js               # address book CRUD
        ├── orders.js                    # order history + order detail + cancel
        ├── profile.js                     # view/update name & phone
        └── admin.js                         # products / categories / orders tabs
```

## Notes

- Auth token and user profile are kept in `localStorage` under `ss_token` / `ss_user` — standard for a JWT-based SPA. Signing out clears both.
- The "Admin" nav link and `/admin` route only appear/allow access for users with `ROLE_ADMIN` (promote a user via the backend's database, as described in its README).
- All pages are plain functions that render into `#view`; there's no virtual DOM — each page just re-renders its own HTML and re-attaches its own event listeners on data changes, which keeps the code simple to trace end-to-end.
