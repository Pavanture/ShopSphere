// ==========================================================================
// Admin category add/edit modal
// ==========================================================================
import { api } from '../api.js';
import { showToast } from '../helpers.js';

export function openCategoryModal(category, onSaved) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const isEdit = !!category;

  backdrop.innerHTML = `
    <div class="modal-box">
      <h3>${isEdit ? 'Edit category' : 'Add category'}</h3>
      <form id="category-form">
        <div class="field"><label>Name</label><input name="name" required value="${category?.name || ''}"/></div>
        <div class="field"><label>Description (optional)</label><textarea name="description" rows="3">${category?.description || ''}</textarea></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" id="cancel-modal">Cancel</button>
          <button type="submit" class="btn btn-wine">Save category</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);
  const close = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector('#cancel-modal').addEventListener('click', close);

  backdrop.querySelector('#category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      name: form.get('name').trim(),
      description: form.get('description').trim() || undefined,
    };

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
      if (isEdit) {
        await api.updateCategory(category.id, payload);
        showToast('Category updated.', 'ok');
      } else {
        await api.createCategory(payload);
        showToast('Category created.', 'ok');
      }
      close();
      onSaved && onSaved();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save category';
    }
  });
}
