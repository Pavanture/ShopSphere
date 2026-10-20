// ==========================================================================
// Addresses page — list, add, edit, delete shipping addresses
// ==========================================================================
import { api } from '../api.js';
import { showToast, escapeHtml } from '../helpers.js';
import { openAddressModal } from '../components/addressModal.js';

export async function renderAddresses(container) {
  container.innerHTML = `
    <h1 class="page-title">Addresses</h1>
    <p class="page-sub">Manage the shipping addresses on your account.</p>
    <button class="btn btn-wine mb-16" id="add-address-btn">Add address</button>
    <div id="address-list"><div class="spinner-row">Loading addresses…</div></div>
  `;

  container.querySelector('#add-address-btn').addEventListener('click', () => {
    openAddressModal(null, () => renderAddresses(container));
  });

  await loadAddresses(container);
}

async function loadAddresses(container) {
  const list = container.querySelector('#address-list');
  try {
    const addresses = await api.getAddresses();
    if (addresses.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="title">No addresses yet</div><p>Add one before you check out.</p></div>`;
      return;
    }
    list.innerHTML = addresses.map(addressCard).join('');

    list.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const address = addresses.find((a) => String(a.id) === btn.dataset.edit);
        openAddressModal(address, () => renderAddresses(container));
      });
    });

    list.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this address?')) return;
        try {
          await api.deleteAddress(btn.dataset.delete);
          showToast('Address deleted.', 'ok');
          loadAddresses(container);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><div class="title">Couldn't load addresses</div><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function addressCard(a) {
  return `
    <div class="address-card">
      <div>
        <div style="font-weight:600;">${escapeHtml(a.fullName)} ${a.isDefault ? '<span class="badge-role" style="background:var(--brass);">DEFAULT</span>' : ''}</div>
        <div class="muted" style="font-size:13px;margin-top:4px;">
          ${escapeHtml(a.addressLine1)}${a.addressLine2 ? ', ' + escapeHtml(a.addressLine2) : ''}<br/>
          ${escapeHtml(a.city)}, ${escapeHtml(a.state)} ${escapeHtml(a.postalCode)}, ${escapeHtml(a.country)}<br/>
          ${escapeHtml(a.phone)}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button class="link-btn" data-edit="${a.id}">Edit</button>
        <button class="link-btn" style="color:var(--danger);" data-delete="${a.id}">Delete</button>
      </div>
    </div>
  `;
}
