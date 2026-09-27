// ==========================================================================
// Shared address add/edit modal
// ==========================================================================
import { api } from '../api.js';
import { showToast } from '../helpers.js';

export function openAddressModal(address, onSaved) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const isEdit = !!address;

  backdrop.innerHTML = `
    <div class="modal-box">
      <h3>${isEdit ? 'Edit address' : 'Add address'}</h3>
      <form id="address-form">
        <div class="field"><label>Full name</label><input name="fullName" required value="${address?.fullName || ''}"/></div>
        <div class="field"><label>Phone</label><input name="phone" required value="${address?.phone || ''}"/></div>
        <div class="field"><label>Address line 1</label><input name="addressLine1" required value="${address?.addressLine1 || ''}"/></div>
        <div class="field"><label>Address line 2 (optional)</label><input name="addressLine2" value="${address?.addressLine2 || ''}"/></div>
        <div class="field"><label>City</label><input name="city" required value="${address?.city || ''}"/></div>
        <div class="field"><label>State</label><input name="state" required value="${address?.state || ''}"/></div>
        <div class="field"><label>Postal code</label><input name="postalCode" required value="${address?.postalCode || ''}"/></div>
        <div class="field"><label>Country</label><input name="country" required value="${address?.country || ''}"/></div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13.5px;">
          <input type="checkbox" name="isDefault" style="width:auto;" ${address?.isDefault ? 'checked' : ''}/> Set as default
        </label>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" id="cancel-modal">Cancel</button>
          <button type="submit" class="btn btn-wine">Save address</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector('#cancel-modal').addEventListener('click', close);

  backdrop.querySelector('#address-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      fullName: form.get('fullName').trim(),
      phone: form.get('phone').trim(),
      addressLine1: form.get('addressLine1').trim(),
      addressLine2: form.get('addressLine2').trim() || undefined,
      city: form.get('city').trim(),
      state: form.get('state').trim(),
      postalCode: form.get('postalCode').trim(),
      country: form.get('country').trim(),
      isDefault: form.get('isDefault') === 'on',
    };

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
      if (isEdit) {
        await api.updateAddress(address.id, payload);
        showToast('Address updated.', 'ok');
      } else {
        await api.addAddress(payload);
        showToast('Address added.', 'ok');
      }
      close();
      onSaved && onSaved();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save address';
    }
  });
}
