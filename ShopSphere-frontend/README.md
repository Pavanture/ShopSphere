# ShopSphere Frontend

The React and Vite frontend for the ShopSphere Spring Boot API. It includes product discovery and search, authentication, cart and checkout, address management, order history, and admin tools for manually managing products, categories, and orders.

## Run locally

Start the backend first (see the backend README), then:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The backend's default CORS origin is `http://localhost:3000`, so the local frontend works without changing CORS settings.

## API URL

The API base URL is configured in `index.html`:

```html
<script>
  window.SHOPSPHERE_API_BASE = 'http://localhost:8080/api';
</script>
```

Set this to the deployed backend URL followed by `/api` before building for deployment.

## Production build

```bash
npm run build
npm run preview
```

The static production bundle is written to `dist`.

For Vercel, set the project root to `ShopSphere-frontend`, the build command to `npm run build`, and the output directory to `dist`. Configure the backend's `CORS_ALLOWED_ORIGINS` to the exact deployed frontend origin.

## Project structure

```text
shopsphere-frontend/
├── index.html
├── package.json
├── vite.config.js
├── assets/                   # Elmavia logos
├── css/
│   ├── styles.css            # shared shop UI
│   └── home.css              # campaign/homepage styling
├── js/
│   ├── api.js                # REST API client
│   ├── helpers.js            # toast, formatting, navigation
│   └── state.js              # localStorage-backed auth state
└── src/
    ├── main.jsx              # React entry point
    └── App.jsx               # hash routing, pages, and admin components
```

Authentication remains stored in `localStorage` under `ss_token` and `ss_user`. Admin product forms support manual product and variant entry; variants include colour, size, image URL, and stock.
