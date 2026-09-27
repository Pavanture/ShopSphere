// ==========================================================================
// Profile page — view/update the current user's name and phone
// ==========================================================================
import { api } from '../api.js';
import { showToast } from '../helpers.js';
import { state, login } from '../state.js';

export async function renderProfile(container) {
  let me;
  try {
    me = await api.getMe();
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="title">Couldn't load your profile</div><p>${err.message}</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="form-card">
      <h1 class="page-title">Your profile</h1>
      <p class="page-sub">${me.email} · ${me.role === 'ROLE_ADMIN' ? 'Administrator' : 'Customer'}</p>
      <form id="profile-form">
        <div class="field">
          <label for="name">Full name</label>
          <input id="name" value="${me.name}" required />
        </div>
        <div class="field">
          <label for="phone">Phone</label>
          <input id="phone" value="${me.phone || ''}" />
        </div>
        <button type="submit" class="btn btn-wine" style="width:100%">Save changes</button>
      </form>
    </div>
  `;

  container.querySelector('#profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#name').value.trim();
    const phone = container.querySelector('#phone').value.trim();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try {
      const updated = await api.updateMe({ name, phone: phone || undefined });
      state.user = { ...state.user, name: updated.name, phone: updated.phone };
      localStorage.setItem('ss_user', JSON.stringify(state.user));
      login({ accessToken: state.token, user: state.user });
      showToast('Profile updated.', 'ok');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save changes';
    }
  });
}
