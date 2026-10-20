// ==========================================================================
// Login / Register pages
// ==========================================================================
import { api, ApiError } from '../api.js';
import { login } from '../state.js';
import { showToast, navigate, escapeHtml } from '../helpers.js';

export function renderLogin(container) {
  container.innerHTML = `
    <div class="form-card">
      <img src="assets/logo.svg" alt="Elmavia" style="height:34px;display:block;margin:0 auto 24px;" />
      <h1 class="page-title" style="text-align:center;font-size:26px;">Sign in</h1>
      <p class="page-sub" style="text-align:center;">Welcome back to Elmavia.</p>
      <form id="login-form">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" required autocomplete="email" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" required autocomplete="current-password" />
        </div>
        <button type="submit" class="btn btn-wine" style="width:100%">Sign in</button>
      </form>
      <p class="form-footer">New here? <a href="#/register" class="link-btn">Create an account</a></p>
    </div>
  `;

  container.querySelector('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = container.querySelector('#email').value.trim();
    const password = container.querySelector('#password').value;
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    try {
      const res = await api.login({ email, password });
      login(res);
      showToast(`Welcome back, ${res.user.name.split(' ')[0]}.`, 'ok');
      navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  });
}

export function renderRegister(container) {
  container.innerHTML = `
    <div class="form-card">
      <img src="assets/logo.svg" alt="Elmavia" style="height:34px;display:block;margin:0 auto 24px;" />
      <h1 class="page-title" style="text-align:center;font-size:26px;">Create account</h1>
      <p class="page-sub" style="text-align:center;">Join Elmavia in a few seconds.</p>
      <form id="register-form">
        <div class="field">
          <label for="name">Full name</label>
          <input id="name" required />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" required autocomplete="email" />
        </div>
        <div class="field">
          <label for="phone">Phone (optional)</label>
          <input id="phone" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" required minlength="8" autocomplete="new-password" />
          <div class="muted" style="font-size:12px;margin-top:4px;">At least 8 characters.</div>
        </div>
        <button type="submit" class="btn btn-wine" style="width:100%">Create account</button>
      </form>
      <p class="form-footer">Already have an account? <a href="#/login" class="link-btn">Sign in</a></p>
    </div>
  `;

  container.querySelector('#register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#name').value.trim();
    const email = container.querySelector('#email').value.trim();
    const phone = container.querySelector('#phone').value.trim();
    const password = container.querySelector('#password').value;
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Creating account…';
    try {
      const res = await api.register({ name, email, phone: phone || undefined, password });
      login(res);
      showToast(`Account created. Welcome, ${res.user.name.split(' ')[0]}.`, 'ok');
      navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Create account';
    }
  });
}
