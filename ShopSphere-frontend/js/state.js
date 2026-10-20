// ==========================================================================
// ShopSphere frontend — client-side state
// Persists auth session in localStorage; keeps cart count in memory,
// synced from the backend after each mutation.
// ==========================================================================

const listeners = new Set();

export const state = {
  user: null,       // { id, name, email, role, ... }
  token: null,
  cartCount: 0,
};

export function initState() {
  const token = localStorage.getItem('ss_token');
  const userJson = localStorage.getItem('ss_user');
  if (token && userJson) {
    try {
      state.token = token;
      state.user = JSON.parse(userJson);
    } catch {
      logout();
    }
  }
}

export function isLoggedIn() {
  return !!state.token;
}

export function isAdmin() {
  return state.user && state.user.role === 'ROLE_ADMIN';
}

export function login(authResponse) {
  state.token = authResponse.accessToken;
  state.user = authResponse.user;
  localStorage.setItem('ss_token', authResponse.accessToken);
  localStorage.setItem('ss_user', JSON.stringify(authResponse.user));
  notify();
}

export function logout() {
  state.token = null;
  state.user = null;
  state.cartCount = 0;
  localStorage.removeItem('ss_token');
  localStorage.removeItem('ss_user');
  notify();
}

export function setCartCount(count) {
  state.cartCount = count;
  notify();
}

export function onStateChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn(state));
}
