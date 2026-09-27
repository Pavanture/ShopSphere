// ==========================================================================
// Checkout page — pick a shipping address, place the order
// ==========================================================================
import { api } from '../api.js';
import { showToast, navigate, escapeHtml, formatMoney } from '../helpers.js';
import { openAddressModal } from '../components/addressModal.js';
import { refreshCartBadge } from '../layout.js';

export async function renderCheckout(container) {
  container.innerHTML = '<div class="spinner-row">Loading checkout…</div>';

  let cart, addresses;
  try {
    [cart, addresses] = await Promise.all([api.getCart(), api.getAddresses()]);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="title">Couldn't load checkout</div><p>${escapeHtml(err.message)}</p></div>`;
    return;
  }

  if (!cart.items || cart.items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="title">Your cart is empty</div>
        <p>Add something from <a href="#/" class="link-btn">the shelf</a> before checking out.</p>
      </div>`;
    return;
  }

  let selectedId = addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || null;

  const draw = () => {
    container.innerHTML = `
      <h1 class="page-title">Checkout</h1>
      <div class="two-col">
        <div>
          <h2 class="section-title">Ship to</h2>
          <div id="address-options"></div>
          <button class="link-btn mt-16" id="add-address-btn">+ Add a new address</button>

          <h2 class="section-title mt-16" style="margin-top:32px;">Order items</h2>
          <div class="row-list">
            ${cart.items
              .map(
                (i) => `
              <div class="row-item">
                <div class="row-thumb"></div>
                <div class="row-info">
                  <div class="name">${escapeHtml(i.product.name)}</div>
                  <div class="meta">Qty ${i.quantity} × ${formatMoney(i.product.price)}</div>
                </div>
                <span class="ticket">${formatMoney(i.lineTotal)}</span>
              </div>`
              )
              .join('')}
          </div>
        </div>
        <div class="summary-card">
          <h2 class="section-title">Summary</h2>
          <div class="summary-line"><span>Items</span><span>${cart.totalItems}</span></div>
          <div class="summary-line total"><span>Total</span><span>${formatMoney(cart.subtotal)}</span></div>
          <button class="btn btn-wine" style="width:100%;margin-top:8px;" id="place-order-btn" ${addresses.length === 0 ? 'disabled' : ''}>
            Place order
          </button>
          ${addresses.length === 0 ? '<p class="muted" style="font-size:12px;margin-top:8px;">Add a shipping address to continue.</p>' : ''}
        </div>
      </div>
    `;

    const optionsEl = container.querySelector('#address-options');
    optionsEl.innerHTML = addresses
      .map(
        (a) => `
      <label class="address-card" style="cursor:pointer;align-items:center;">
        <div>
          <input type="radio" name="address" value="${a.id}" ${String(a.id) === String(selectedId) ? 'checked' : ''} style="width:auto;margin-right:10px;"/>
          <strong>${escapeHtml(a.fullName)}</strong><br/>
          <span class="muted" style="font-size:13px;">${escapeHtml(a.addressLine1)}, ${escapeHtml(a.city)}, ${escapeHtml(a.state)} ${escapeHtml(a.postalCode)}</span>
        </div>
      </label>`
      )
      .join('');

    optionsEl.querySelectorAll('input[name="address"]').forEach((input) => {
      input.addEventListener('change', () => { selectedId = input.value; });
    });

    container.querySelector('#add-address-btn').addEventListener('click', () => {
      openAddressModal(null, async () => {
        addresses = await api.getAddresses();
        selectedId = addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || selectedId;
        draw();
      });
    });

    const placeBtn = container.querySelector('#place-order-btn');
    if (placeBtn) {
      placeBtn.addEventListener('click', async () => {
        if (!selectedId) {
          showToast('Choose a shipping address.', 'error');
          return;
        }
        placeBtn.disabled = true;
        placeBtn.textContent = 'Placing order…';
        try {
          const order = await api.createOrder({ addressId: selectedId });
          showToast('Order placed!', 'ok');
          refreshCartBadge();
          navigate(`/orders/${order.id}`);
        } catch (err) {
          showToast(err.message, 'error');
          placeBtn.disabled = false;
          placeBtn.textContent = 'Place order';
        }
      });
    }
  };

  draw();
}
