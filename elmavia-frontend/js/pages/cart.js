// ==========================================================================
// Cart page
// ==========================================================================
import { api } from '../api.js';
import { showToast, navigate, escapeHtml, formatMoney, placeholderThumb } from '../helpers.js';
import { refreshCartBadge } from '../layout.js';

export async function renderCart(container) {
  container.innerHTML = '<div class="spinner-row">Loading your cart…</div>';

  let cart;
  try {
    cart = await api.getCart();
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="title">Couldn't load your cart</div><p>${escapeHtml(err.message)}</p></div>`;
    return;
  }

  if (!cart.items || cart.items.length === 0) {
    container.innerHTML = `
      <h1 class="page-title">Your cart</h1>
      <div class="empty-state">
        <div class="title">Your cart is empty</div>
        <p>Find something on <a href="#/" class="link-btn">the shelf</a>.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <h1 class="page-title">Your cart</h1>
    <div class="two-col">
      <div>
        <div class="row-list" id="cart-rows"></div>
        <button class="link-btn mt-16" id="clear-cart">Clear cart</button>
      </div>
      <div class="summary-card">
        <h2 class="section-title">Summary</h2>
        <div class="summary-line"><span>Items</span><span id="sum-items">${cart.totalItems}</span></div>
        <div class="summary-line total"><span>Subtotal</span><span id="sum-total">${formatMoney(cart.subtotal)}</span></div>
        <button class="btn btn-wine" style="width:100%;margin-top:8px;" id="checkout-btn">Checkout</button>
      </div>
    </div>
  `;

  renderRows(container, cart);

  container.querySelector('#clear-cart').addEventListener('click', async () => {
    if (!confirm('Remove all items from your cart?')) return;
    try {
      await api.clearCart();
      showToast('Cart cleared.', 'ok');
      refreshCartBadge();
      renderCart(container);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  container.querySelector('#checkout-btn').addEventListener('click', () => navigate('/checkout'));
}

function renderRows(container, cart) {
  const rowsEl = container.querySelector('#cart-rows');
  rowsEl.innerHTML = cart.items
    .map(
      (item) => `
      <div class="row-item" data-product-id="${item.product.id}">
        <div class="row-thumb"></div>
        <div class="row-info">
          <div class="name">${escapeHtml(item.product.name)}</div>
          <div class="meta">${formatMoney(item.product.price)} each · ${item.product.stock} in stock</div>
        </div>
        <div class="qty-control">
          <button type="button" class="qty-minus">−</button>
          <span>${item.quantity}</span>
          <button type="button" class="qty-plus">+</button>
        </div>
        <span class="ticket">${formatMoney(item.lineTotal)}</span>
        <button class="link-btn remove-item" style="color:var(--danger);">Remove</button>
      </div>
    `
    )
    .join('');

  rowsEl.querySelectorAll('.row-item').forEach((row) => {
    const productId = row.dataset.productId;
    const item = cart.items.find((i) => String(i.product.id) === productId);

    row.querySelector('.qty-minus').addEventListener('click', () =>
      updateQuantity(container, productId, Math.max(1, item.quantity - 1))
    );
    row.querySelector('.qty-plus').addEventListener('click', () =>
      updateQuantity(container, productId, item.quantity + 1)
    );
    row.querySelector('.remove-item').addEventListener('click', async () => {
      try {
        await api.removeCartItem(productId);
        showToast('Removed from cart.', 'ok');
        refreshCartBadge();
        renderCart(container);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

async function updateQuantity(container, productId, quantity) {
  try {
    await api.updateCartItem(productId, { quantity });
    refreshCartBadge();
    renderCart(container);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
