// ==========================================================================
// Admin product add/edit modal
// ==========================================================================
import { api } from '../api.js';
import { escapeHtml, showToast } from '../helpers.js';

export function openProductModal(product, categories, onSaved) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const isEdit = !!product;

  backdrop.innerHTML = `
    <div class="modal-box">
      <h3>${isEdit ? 'Edit product' : 'Add product'}</h3>
      <form id="product-form">
        <div class="field"><label>Name</label><input name="name" required value="${product?.name || ''}"/></div>
        <div class="field"><label>Description</label><textarea name="description" rows="3">${product?.description || ''}</textarea></div>
        <div class="field"><label>Price</label><input name="price" type="number" step="0.01" min="0.01" required value="${product?.price ?? ''}"/></div>
        <div class="field"><label>Stock (used when there are no variants)</label><input name="stock" type="number" step="1" min="0" required value="${product?.stock ?? ''}"/></div>
        <div class="field">
          <label>Default Qikink SKU</label>
          <input name="qikinkSku" maxlength="50" placeholder="SKU from Qikink My Products" value="${escapeHtml(product?.qikinkSku || '')}"/>
          <p class="field-hint">Used for simple products. Variant SKUs are entered below.</p>
        </div>
        <div class="field">
          <label>Category</label>
          <select name="categoryId" required>
            ${categories.map((c) => `<option value="${c.id}" ${product?.category?.id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Product image URL</label>
          <input name="imageUrl" type="url" placeholder="https://.../your-tshirt.jpg" value="${product?.imageUrl || ''}"/>
          <div class="product-image-preview ${product?.imageUrl ? 'has-image' : ''}" id="product-image-preview">
            ${product?.imageUrl ? `<img src="${product.imageUrl}" alt="Product preview" />` : '<span>Image preview</span>'}
          </div>
          <p class="field-hint">Use a public image link. Keep stock above 0 to show Add to cart.</p>
        </div>
        <div class="field">
          <label>Colour and size variants</label>
          <div class="variant-list" id="variant-list">
            ${(product?.variants || []).map(renderVariantRow).join('')}
          </div>
          <button type="button" class="btn btn-outline btn-small" id="add-variant">Add variant</button>
          <p class="field-hint">Add one row per colour/size combination with its image, available stock, and Qikink SKU.</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" id="cancel-modal">Cancel</button>
          <button type="submit" class="btn btn-wine">Save product</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);
  const close = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector('#cancel-modal').addEventListener('click', close);

  const variantList = backdrop.querySelector('#variant-list');
  backdrop.querySelector('#add-variant').addEventListener('click', () => {
    variantList.insertAdjacentHTML('beforeend', renderVariantRow());
  });
  variantList.addEventListener('click', (event) => {
    if (event.target.closest('[data-remove-variant]')) {
      event.target.closest('.variant-row').remove();
    }
  });

  const imageInput = backdrop.querySelector('input[name="imageUrl"]');
  const imagePreview = backdrop.querySelector('#product-image-preview');
  imageInput.addEventListener('input', () => {
    const imageUrl = imageInput.value.trim();
    imagePreview.classList.toggle('has-image', Boolean(imageUrl));
    imagePreview.innerHTML = imageUrl
      ? `<img src="${imageUrl.replace(/"/g, '&quot;')}" alt="Product preview" />`
      : '<span>Image preview</span>';
  });
  imagePreview.addEventListener('error', () => {
    imagePreview.classList.remove('has-image');
    imagePreview.innerHTML = '<span>Image link could not be loaded</span>';
  }, true);

  backdrop.querySelector('#product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      name: form.get('name').trim(),
      description: form.get('description').trim() || undefined,
      price: parseFloat(form.get('price')),
      stock: parseInt(form.get('stock'), 10),
      categoryId: parseInt(form.get('categoryId'), 10),
      imageUrl: form.get('imageUrl').trim() || undefined,
      qikinkSku: form.get('qikinkSku').trim() || undefined,
      variants: [...variantList.querySelectorAll('.variant-row')].map((row) => ({
        id: row.querySelector('[name="variantId"]').value
          ? parseInt(row.querySelector('[name="variantId"]').value, 10)
          : undefined,
        colorName: row.querySelector('[name="variantColorName"]').value.trim(),
        colorValue: row.querySelector('[name="variantColorValue"]').value,
        size: row.querySelector('[name="variantSize"]').value.trim(),
        imageUrl: row.querySelector('[name="variantImageUrl"]').value.trim(),
        stock: parseInt(row.querySelector('[name="variantStock"]').value, 10),
        qikinkSku: row.querySelector('[name="variantSku"]').value.trim() || undefined,
      })),
    };
    if (payload.variants.length) {
      payload.stock = payload.variants.reduce((sum, variant) => sum + variant.stock, 0);
      payload.qikinkSku = undefined;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
      if (isEdit) {
        await api.updateProduct(product.id, payload);
        showToast('Product updated.', 'ok');
      } else {
        await api.createProduct(payload);
        showToast('Product created.', 'ok');
      }
      close();
      onSaved && onSaved();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save product';
    }
  });
}

function renderVariantRow(variant = {}) {
  return `
    <div class="variant-row">
      <input name="variantId" type="hidden" value="${variant.id ?? ''}" />
      <input name="variantColorName" required maxlength="50" placeholder="Color name" aria-label="Variant color name" value="${escapeHtml(variant.colorName || '')}" />
      <input name="variantColorValue" required type="color" aria-label="Swatch color" value="${escapeHtml(variant.colorValue || '#222222')}" />
      <input name="variantSize" required maxlength="30" placeholder="Size (e.g. M)" aria-label="Variant size" value="${escapeHtml(variant.size || '')}" />
      <input name="variantImageUrl" required type="url" maxlength="1000" placeholder="Public image URL" aria-label="Variant image URL" value="${escapeHtml(variant.imageUrl || '')}" />
      <input name="variantStock" required type="number" min="0" step="1" placeholder="Stock" aria-label="Variant stock" value="${variant.stock ?? 0}" />
      <input name="variantSku" maxlength="50" placeholder="Qikink SKU" aria-label="Qikink SKU" value="${escapeHtml(variant.qikinkSku || '')}" />
      <button type="button" class="link-btn variant-remove" data-remove-variant aria-label="Remove variant">Remove</button>
    </div>
  `;
}
