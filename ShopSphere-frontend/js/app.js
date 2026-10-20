
import { initState, isLoggedIn, isAdmin } from './state.js';
import { mountLayout, refreshCartBadge } from './layout.js';
import { showToast, navigate } from './helpers.js';

import { renderHome } from './pages/home.js';
import { renderProduct } from './pages/product.js';
import { renderLogin, renderRegister } from './pages/auth.js';
import { renderCart } from './pages/cart.js';
import { renderCheckout } from './pages/checkout.js';
import { renderAddresses } from './pages/addresses.js';
import { renderOrders, renderOrderDetail } from './pages/orders.js';
import { renderProfile } from './pages/profile.js';
import { renderAdmin } from './pages/admin.js';

const view = document.getElementById('view');

const routes = [
  { pattern: /^\/$/, handler: renderHome, auth: false },
  { pattern: /^\/product\/(\d+)$/, handler: renderProduct, auth: false, hasId: true },
  { pattern: /^\/login$/, handler: renderLogin, auth: false, guestOnly: true },
  { pattern: /^\/register$/, handler: renderRegister, auth: false, guestOnly: true },
  { pattern: /^\/cart$/, handler: renderCart, auth: true },
  { pattern: /^\/checkout$/, handler: renderCheckout, auth: true },
  { pattern: /^\/addresses$/, handler: renderAddresses, auth: true },
  { pattern: /^\/orders$/, handler: renderOrders, auth: true },
  { pattern: /^\/orders\/(\d+)$/, handler: renderOrderDetail, auth: true, hasId: true },
  { pattern: /^\/profile$/, handler: renderProfile, auth: true },
  { pattern: /^\/admin$/, handler: renderAdmin, auth: true, adminOnly: true },
];

function parseHash() {
  let hash = window.location.hash.slice(1) || '/';
  const [path, query] = hash.split('?');
  return { path: path || '/', params: new URLSearchParams(query || '') };
}

async function renderRoute() {
  const { path, params } = parseHash();
  const match = routes.find((r) => r.pattern.test(path));

  if (!match) {
    view.innerHTML = `
      <div class="empty-state">
        <div class="title">Page not found</div>
        <p><a href="#/" class="link-btn">Go back to the shelf</a></p>
      </div>`;
    window.scrollTo(0, 0);
    return;
  }

  if (match.guestOnly && isLoggedIn()) {
    navigate('/');
    return;
  }

  if (match.auth && !isLoggedIn()) {
    showToast('Sign in to continue.', 'error');
    navigate('/login');
    return;
  }

  if (match.adminOnly && !isAdmin()) {
    showToast("You don't have access to that page.", 'error');
    navigate('/');
    return;
  }

  view.innerHTML = '';
  window.scrollTo(0, 0);

  if (match.hasId) {
    const id = path.match(match.pattern)[1];
    await match.handler(view, params, id);
  } else {
    await match.handler(view, params);
  }
}

function init() {
  initState();
  mountLayout();
  refreshCartBadge();
  window.addEventListener('hashchange', renderRoute);
  renderRoute();
}

init();
