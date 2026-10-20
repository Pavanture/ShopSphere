// ==========================================================================
// Admin panel — Products / Categories / Orders tabs
// ==========================================================================
import { api } from '../api.js';
import { showToast, escapeHtml, formatMoney, formatDate } from '../helpers.js';
import { openProductModal } from '../components/productModal.js';
import { openCategoryModal } from '../components/categoryModal.js';

const TABS = ['products', 'categories', 'orders'];

export async function renderAdmin(container, params) {
  const activeTab = TABS.includes(params.get('tab')) ? params.get('tab') : 'products';

  container.innerHTML = `
    <h1 class="page-title">Admin</h1>
    <p class="page-sub">Manage the catalog and fulfil orders.</p>
    <div class="admin-tabs">
      <button data-tab="products" class="${activeTab === 'products' ? 'active' : ''}">Products</button>
      <button data-tab="categories" class="${activeTab === 'categories' ? 'active' : ''}">Categories</button>
      <button data-tab="orders" class="${activeTab === 'orders' ? 'active' : ''}">Orders</button>
    </div>
    <div id="admin-tab-content"><div class="spinner-row">Loading…</div></div>
  `;

  container.querySelectorAll('.admin-tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.hash = `/admin?tab=${btn.dataset.tab}`;
    });
  });

  const content = container.querySelector('#admin-tab-content');
  if (activeTab === 'products') await renderProductsTab(content);
  else if (activeTab === 'categories') await renderCategoriesTab(content);
  else await renderOrdersTab(content, params);
}

// ---------------- Products tab ----------------

async function renderProductsTab(content) {
  let categories = [];
  try {
    categories = await api.getCategories();
  } catch {
    /* handled below via product load failure */
  }

  const load = async () => {
    content.innerHTML = '<div class="spinner-row">Loading products…</div>';
    try {
      const res = await api.getProducts({ page: 0, size: 100, sortBy: 'id', direction: 'desc' });
      content.innerHTML = `
        <button class="btn btn-wine mb-16" id="add-product-btn">Add product</button>
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            ${res.content
              .map(
                (p) => `
              <tr data-id="${p.id}">
                <td>${escapeHtml(p.name)}</td>
                <td>${escapeHtml(p.category ? p.category.name : '—')}</td>
                <td>${formatMoney(p.price)}</td>
                <td>${p.stock}</td>
                <td style="text-align:right;">
                  <button class="link-btn" data-edit>Edit</button>
                  &nbsp;
                  <button class="link-btn" style="color:var(--danger);" data-delete>Delete</button>
                </td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;

      content.querySelector('#add-product-btn').addEventListener('click', () => {
        if (categories.length === 0) {
          showToast('Create a category first.', 'error');
          return;
        }
        openProductModal(null, categories, load);
      });

      content.querySelectorAll('tr[data-id]').forEach((row) => {
        const product = res.content.find((p) => String(p.id) === row.dataset.id);
        row.querySelector('[data-edit]').addEventListener('click', () => openProductModal(product, categories, load));
        row.querySelector('[data-delete]').addEventListener('click', async () => {
          if (!confirm(`Delete "${product.name}"?`)) return;
          try {
            await api.deleteProduct(product.id);
            showToast('Product deleted.', 'ok');
            load();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });
    } catch (err) {
      content.innerHTML = `<div class="empty-state"><div class="title">Couldn't load products</div><p>${escapeHtml(err.message)}</p></div>`;
    }
  };

  await load();
}

// ---------------- Categories tab ----------------

async function renderCategoriesTab(content) {
  const load = async () => {
    content.innerHTML = '<div class="spinner-row">Loading categories…</div>';
    try {
      const categories = await api.getCategories();
      content.innerHTML = `
        <button class="btn btn-wine mb-16" id="add-category-btn">Add category</button>
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Description</th><th></th></tr></thead>
          <tbody>
            ${categories
              .map(
                (c) => `
              <tr data-id="${c.id}">
                <td>${escapeHtml(c.name)}</td>
                <td class="muted">${escapeHtml(c.description || '—')}</td>
                <td style="text-align:right;">
                  <button class="link-btn" data-edit>Edit</button>
                  &nbsp;
                  <button class="link-btn" style="color:var(--danger);" data-delete>Delete</button>
                </td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;

      content.querySelector('#add-category-btn').addEventListener('click', () => openCategoryModal(null, load));

      content.querySelectorAll('tr[data-id]').forEach((row) => {
        const category = categories.find((c) => String(c.id) === row.dataset.id);
        row.querySelector('[data-edit]').addEventListener('click', () => openCategoryModal(category, load));
        row.querySelector('[data-delete]').addEventListener('click', async () => {
          if (!confirm(`Delete category "${category.name}"? Products using it must be reassigned first.`)) return;
          try {
            await api.deleteCategory(category.id);
            showToast('Category deleted.', 'ok');
            load();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });
    } catch (err) {
      content.innerHTML = `<div class="empty-state"><div class="title">Couldn't load categories</div><p>${escapeHtml(err.message)}</p></div>`;
    }
  };

  await load();
}

// ---------------- Orders tab ----------------

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

async function renderOrdersTab(content, params) {
  const page = parseInt(params.get('page') || '0', 10);
  content.innerHTML = '<div class="spinner-row">Loading orders…</div>';

  try {
    const res = await api.getAllOrders({ page, size: 10 });
    if (res.content.length === 0) {
      content.innerHTML = `<div class="empty-state"><div class="title">No orders yet</div></div>`;
      return;
    }

    content.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Order status</th><th>Payment</th><th></th></tr></thead>
        <tbody>
          ${res.content
            .map(
              (o) => `
            <tr data-id="${o.id}">
              <td>#${o.id}</td>
              <td>${formatDate(o.createdAt)}</td>
              <td>${formatMoney(o.totalAmount)}</td>
              <td>
                <select data-order-status>
                  ${ORDER_STATUSES.map((s) => `<option value="${s}" ${s === o.orderStatus ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </td>
              <td>
                <select data-payment-status>
                  ${PAYMENT_STATUSES.map((s) => `<option value="${s}" ${s === o.paymentStatus ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </td>
              <td><button class="btn btn-small btn-outline" data-save>Save</button></td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
      <div class="pagination" id="pagination"></div>
    `;

    content.querySelectorAll('tr[data-id]').forEach((row) => {
      row.querySelector('[data-save]').addEventListener('click', async () => {
        const orderStatus = row.querySelector('[data-order-status]').value;
        const paymentStatus = row.querySelector('[data-payment-status]').value;
        try {
          await api.updateOrderStatus(row.dataset.id, { orderStatus, paymentStatus });
          showToast(`Order #${row.dataset.id} updated.`, 'ok');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    const paginationEl = content.querySelector('#pagination');
    const prevDisabled = res.pageNumber <= 0;
    const nextDisabled = res.last;
    paginationEl.innerHTML = `
      <button class="btn btn-outline btn-small" id="prev-page" ${prevDisabled ? 'disabled' : ''}>← Prev</button>
      <span>Page ${res.pageNumber + 1} of ${Math.max(res.totalPages, 1)}</span>
      <button class="btn btn-outline btn-small" id="next-page" ${nextDisabled ? 'disabled' : ''}>Next →</button>
    `;
    if (!prevDisabled) paginationEl.querySelector('#prev-page').addEventListener('click', () => { window.location.hash = `/admin?tab=orders&page=${page - 1}`; });
    if (!nextDisabled) paginationEl.querySelector('#next-page').addEventListener('click', () => { window.location.hash = `/admin?tab=orders&page=${page + 1}`; });
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><div class="title">Couldn't load orders</div><p>${escapeHtml(err.message)}</p></div>`;
  }
}
