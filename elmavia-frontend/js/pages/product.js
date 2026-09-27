// ==========================================================================
// Product detail page
// ==========================================================================
import { api } from '../api.js';
import { showToast, navigate, escapeHtml, formatMoney, placeholderThumb } from '../helpers.js';
import { isLoggedIn } from '../state.js';
import { refreshCartBadge } from '../layout.js';

export async function renderProduct(container, params, id) {
  container.innerHTML = '<div class="spinner-row">Loading product…</div>';

  let product;
  try {
    product = await api.getProduct(id);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="title">Product not found</div><p>${escapeHtml(err.message)}</p></div>`;
    return;
  }

  const out = product.stock <= 0;
  const colors = product.colorImages?.length
    ? product.colorImages
    : [
        { name: 'Black', value: '#172326', filter: 'brightness(0.34) saturate(0.8)' },
        { name: 'White', value: '#f7f7f2', filter: 'grayscale(0.15) brightness(1.3)' },
        { name: 'Coral', value: '#ef684f', filter: 'sepia(0.45) saturate(2.2) hue-rotate(315deg)' },
        { name: 'Teal', value: '#147d78', filter: 'sepia(0.65) saturate(1.7) hue-rotate(135deg)' },
      ];

  container.innerHTML = `
    <a href="#/" class="link-btn" style="display:inline-block;margin-bottom:20px;">← Back to shelf</a>
    <div class="two-col">
      <div>
        <div class="product-thumb product-detail-image" style="aspect-ratio:4/3;font-size:48px;">
          ${product.imageUrl ? `<img id="product-image" src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" onerror="this.parentElement.textContent='${placeholderThumb(product.name)}'"/>` : placeholderThumb(product.name)}
        </div>
      </div>
      <div>
        <p class="product-cat" style="margin-bottom:6px;">${escapeHtml(product.category ? product.category.name : '')}</p>
        <h1 class="page-title" style="font-size:26px;">${escapeHtml(product.name)}</h1>
        <p class="muted" style="margin:14px 0 20px;">${escapeHtml(product.description || 'No description provided.')}</p>
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
          <span class="ticket" style="font-size:18px;">${formatMoney(product.price)}</span>
          <span class="stock-note ${out ? 'low' : ''}">${out ? 'Out of stock' : `${product.stock} in stock`}</span>
        </div>
        <div class="color-picker">
          <div class="color-picker-heading"><span>Color</span><strong id="selected-color">${colors[0].name}</strong></div>
          <div class="color-swatches" role="group" aria-label="Choose a color">
            ${colors.map((color, index) => `<button type="button" class="color-swatch${index === 0 ? ' selected' : ''}" aria-label="${escapeHtml(color.name)}" title="${escapeHtml(color.name)}" data-color="${escapeHtml(color.name)}" data-image="${escapeHtml(color.imageUrl || '')}" data-filter="${color.filter || 'none'}" style="--swatch-color:${color.value || '#d9f06b'};"></button>`).join('')}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="qty-control">
            <button id="qty-minus" type="button">−</button>
            <span id="qty-value">1</span>
            <button id="qty-plus" type="button">+</button>
          </div>
          <button id="add-to-cart" class="btn btn-wine" ${out ? 'disabled' : ''}>Add to cart</button>
        </div>
      </div>
    </div>
  `;

  const image = container.querySelector('#product-image');
  const selectedColor = container.querySelector('#selected-color');
  container.querySelectorAll('.color-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      container.querySelector('.color-swatch.selected')?.classList.remove('selected');
      swatch.classList.add('selected');
      selectedColor.textContent = swatch.dataset.color;
      if (image) {
        if (swatch.dataset.image) image.src = swatch.dataset.image;
        image.style.filter = swatch.dataset.image ? 'none' : swatch.dataset.filter;
      }
    });
  });

  let qty = 1;
  const qtyValue = container.querySelector('#qty-value');
  container.querySelector('#qty-minus').addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    qtyValue.textContent = qty;
  });
  container.querySelector('#qty-plus').addEventListener('click', () => {
    qty = Math.min(product.stock, qty + 1);
    qtyValue.textContent = qty;
  });

  container.querySelector('#add-to-cart').addEventListener('click', async () => {
    if (!isLoggedIn()) {
      showToast('Sign in to add items to your cart.', 'error');
      navigate('/login');
      return;
    }
    try {
      await api.addCartItem({ productId: product.id, quantity: qty });
      showToast('Added to cart.', 'ok');
      refreshCartBadge();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
