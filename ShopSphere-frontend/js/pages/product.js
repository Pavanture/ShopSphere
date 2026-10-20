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

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const colorOptions = [...new Map(variants.map((variant) => [variant.colorName, variant])).values()];
  let selectedColorName = colorOptions[0]?.colorName || '';
  let selectedVariant = variants
    .filter((variant) => variant.colorName === selectedColorName)
    .find((variant) => variant.stock > 0) || variants[0] || null;
  let qty = 1;
  const initialStock = selectedVariant ? selectedVariant.stock : product.stock;
  const out = initialStock <= 0;
  const initialImage = selectedVariant?.imageUrl || product.imageUrl;

  container.innerHTML = `
    <a href="#/" class="link-btn" style="display:inline-block;margin-bottom:20px;">← Back to shelf</a>
    <div class="two-col">
      <div>
        <div class="product-thumb product-detail-image" style="aspect-ratio:4/3;font-size:48px;">
          ${initialImage
            ? `<img id="product-image" src="${escapeHtml(initialImage)}" alt="${escapeHtml(product.name)}" /><span id="product-image-fallback" hidden>${escapeHtml(placeholderThumb(product.name))}</span>`
            : `<span>${escapeHtml(placeholderThumb(product.name))}</span>`}
        </div>
      </div>
      <div>
        <p class="product-cat" style="margin-bottom:6px;">${escapeHtml(product.category ? product.category.name : '')}</p>
        <h1 class="page-title" style="font-size:26px;">${escapeHtml(product.name)}</h1>
        <p class="muted" style="margin:14px 0 20px;">${escapeHtml(product.description || 'No description provided.')}</p>
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
          <span class="ticket" style="font-size:18px;">${formatMoney(product.price)}</span>
          <span id="stock-note" class="stock-note ${out ? 'low' : ''}">${out ? 'Out of stock' : `${initialStock} in stock`}</span>
        </div>
        ${variants.length ? `
          <div class="color-picker">
            <div class="color-picker-heading"><span>Color</span><strong id="selected-color">${escapeHtml(selectedColorName)}</strong></div>
            <div class="color-swatches" role="group" aria-label="Choose a color">
              ${colorOptions.map((color, index) => `<button type="button" class="color-swatch${index === 0 ? ' selected' : ''}" aria-label="${escapeHtml(color.colorName)}" title="${escapeHtml(color.colorName)}" data-color="${escapeHtml(color.colorName)}" style="--swatch-color:${escapeHtml(color.colorValue)};"></button>`).join('')}
            </div>
          </div>
          <div class="color-picker">
            <div class="color-picker-heading"><span>Size</span></div>
            <div class="size-options" id="size-options" role="group" aria-label="Choose a size"></div>
          </div>
        ` : ''}
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="qty-control">
            <button id="qty-minus" type="button">−</button>
            <span id="qty-value">1</span>
            <button id="qty-plus" type="button">+</button>
          </div>
          <button id="add-to-cart" class="btn btn-wine" ${out ? 'disabled' : ''}>${out ? 'Out of stock' : 'Add to cart'}</button>
        </div>
      </div>
    </div>
  `;

  const image = container.querySelector('#product-image');
  const imageFallback = container.querySelector('#product-image-fallback');
  image?.addEventListener('error', () => {
    image.hidden = true;
    if (imageFallback) imageFallback.hidden = false;
  });
  const selectedColor = container.querySelector('#selected-color');
  const qtyValue = container.querySelector('#qty-value');
  const stockNote = container.querySelector('#stock-note');
  const addButton = container.querySelector('#add-to-cart');

  const renderSizes = () => {
    const sizeOptions = container.querySelector('#size-options');
    if (!sizeOptions) return;
    const colorVariants = variants.filter((variant) => variant.colorName === selectedColorName);
    sizeOptions.innerHTML = colorVariants.map((variant) => `
      <button type="button" class="size-option${selectedVariant?.id === variant.id ? ' selected' : ''}"
        data-variant-id="${variant.id}" ${variant.stock <= 0 ? 'disabled' : ''}>
        ${escapeHtml(variant.size)}
      </button>
    `).join('');
    sizeOptions.querySelectorAll('.size-option:not(:disabled)').forEach((button) => {
      button.addEventListener('click', () => {
        selectedVariant = colorVariants.find((variant) => String(variant.id) === button.dataset.variantId);
        updateVariantView();
      });
    });
  };

  const updateVariantView = () => {
    const availableStock = selectedVariant ? selectedVariant.stock : product.stock;
    if (selectedColor) selectedColor.textContent = selectedColorName;
    if (image) {
      image.src = selectedVariant?.imageUrl || product.imageUrl || placeholderThumb();
      image.hidden = false;
      if (imageFallback) imageFallback.hidden = true;
      image.style.filter = 'none';
    }
    if (stockNote) {
      stockNote.textContent = availableStock > 0 ? `${availableStock} in stock` : 'Out of stock';
      stockNote.classList.toggle('low', availableStock <= 0);
    }
    if (addButton) {
      addButton.disabled = availableStock <= 0;
      addButton.textContent = availableStock > 0 ? 'Add to cart' : 'Out of stock';
    }
    qty = availableStock > 0 ? Math.min(qty, availableStock) : 1;
    qtyValue.textContent = qty;
    renderSizes();
  };

  container.querySelectorAll('.color-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      selectedColorName = swatch.dataset.color;
      const colorVariants = variants.filter((variant) => variant.colorName === selectedColorName);
      selectedVariant = colorVariants.find((variant) => variant.stock > 0) || colorVariants[0] || null;
      container.querySelector('.color-swatch.selected')?.classList.remove('selected');
      swatch.classList.add('selected');
      updateVariantView();
    });
  });

  container.querySelector('#qty-minus').addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    qtyValue.textContent = qty;
  });
  container.querySelector('#qty-plus').addEventListener('click', () => {
    const availableStock = selectedVariant ? selectedVariant.stock : product.stock;
    qty = Math.min(availableStock, qty + 1);
    qtyValue.textContent = qty;
  });
  renderSizes();

  addButton.addEventListener('click', async () => {
    if (!isLoggedIn()) {
      showToast('Sign in to add items to your cart.', 'error');
      navigate('/login');
      return;
    }
    try {
      await api.addCartItem({ productId: product.id, variantId: selectedVariant?.id, quantity: qty });
      showToast('Added to cart.', 'ok');
      refreshCartBadge();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
