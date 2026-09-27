// ==========================================================================
// App shell — header, nav, cart badge. Rendered once; updated on state change.
// ==========================================================================
import { api } from './api.js';
import { state, isLoggedIn, isAdmin, logout, setCartCount, onStateChange } from './state.js';
import { navigate, escapeHtml } from './helpers.js';

export function mountLayout() {
  const header = document.getElementById('app-header');
  header.innerHTML = `
    <div class="header-inner">
      <a href="#/" class="wordmark-link" aria-label="Elmavia home">
        <img src="assets/logo.jpg" alt="Elmavia — Grow slowly. Wear deliberately." class="wordmark-logo" />
      </a>
      <form id="search-form" class="nav-search">
        <input id="search-input" type="search" placeholder="Search products…" />
        <button type="submit" aria-label="Search">Search</button>
      </form>
      <nav class="nav-links" id="nav-links"></nav>
    </div>
  `;

  header.querySelector('#search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = header.querySelector('#search-input').value.trim();
    const url = new URLSearchParams();
    if (q) url.set('q', q);
    navigate(`/?${url.toString()}`);
  });

  renderNavLinks();
  onStateChange(renderNavLinks);
  refreshCartBadge();
}

function renderNavLinks() {
  const nav = document.getElementById('nav-links');
  if (!nav) return;

  if (!isLoggedIn()) {
    nav.innerHTML = `
      <a href="#/login">Sign in</a>
      <a href="#/register">Register</a>
    `;
    return;
  }

  const roleBadge = isAdmin() ? '<span class="badge-role">ADMIN</span>' : '';

  nav.innerHTML = `
    ${isAdmin() ? '<a href="#/admin">Admin</a>' : ''}
    <a href="#/orders">Orders</a>
    <a href="#/addresses">Addresses</a>
    <a href="#/cart">Cart<span class="cart-badge" id="cart-badge">0</span></a>
    <a href="#/profile">${escapeHtml(state.user.name.split(' ')[0])}${roleBadge}</a>
    <a href="#" id="logout-link">Sign out</a>
  `;

  const logoutLink = nav.querySelector('#logout-link');
  logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
    navigate('/');
  });

  updateCartBadgeDom();
}

function updateCartBadgeDom() {
  const badge = document.getElementById('cart-badge');
  if (badge) badge.textContent = state.cartCount;
}

export async function refreshCartBadge() {
  if (!isLoggedIn()) {
    setCartCount(0);
    return;
  }
  try {
    const cart = await api.getCart();
    setCartCount(cart.totalItems || 0);
  } catch {
    // Silent — badge just won't update if the request fails.
  }
  updateCartBadgeDom();
}

onStateChange(updateCartBadgeDom);
