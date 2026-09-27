// ==========================================================================
// Admin product add/edit modal
// ==========================================================================
import { api } from '../api.js';
import { showToast } from '../helpers.js';

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
        <div class="field"><label>Stock</label><input name="stock" type="number" step="1" min="0" required value="${product?.stock ?? ''}"/></div>
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
    };

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
