// ==========================================================================
// Orders list + order detail pages (current user's own orders)
// ==========================================================================
import { api } from '../api.js';
import { showToast, navigate, escapeHtml, formatMoney, formatDate } from '../helpers.js';

const PAGE_SIZE = 8;

export async function renderOrders(container, params) {
  const page = parseInt(params.get('page') || '0', 10);

  container.innerHTML = `
    <h1 class="page-title">Your orders</h1>
    <div id="orders-area"><div class="spinner-row">Loading orders…</div></div>
  `;

  const area = container.querySelector('#orders-area');
  try {
    const res = await api.getMyOrders({ page, size: PAGE_SIZE });
    if (!res.content || res.content.length === 0) {
      area.innerHTML = `<div class="empty-state"><div class="title">No orders yet</div><p>Once you place an order it'll show up here.</p></div>`;
      return;
    }

    area.innerHTML = `
      <div class="row-list">
        ${res.content.map(orderRow).join('')}
      </div>
      <div class="pagination" id="pagination"></div>
    `;

    area.querySelectorAll('.row-item').forEach((row) => {
      row.addEventListener('click', () => navigate(`/orders/${row.dataset.id}`));
    });

    renderPagination(area.querySelector('#pagination'), res, page);
  } catch (err) {
    area.innerHTML = `<div class="empty-state"><div class="title">Couldn't load orders</div><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function orderRow(o) {
  return `
    <div class="row-item" data-id="${o.id}" style="cursor:pointer;">
      <div class="row-info">
        <div class="name">Order #${o.id}</div>
        <div class="meta">${formatDate(o.createdAt)} · ${o.orderItems.length} item(s)</div>
      </div>
      <span class="status-pill ${o.orderStatus}">${o.orderStatus}</span>
      <span class="ticket">${formatMoney(o.totalAmount)}</span>
    </div>
  `;
}

function renderPagination(el, page, currentPage) {
  if (!el) return;
  const prevDisabled = page.pageNumber <= 0;
  const nextDisabled = page.last;
  el.innerHTML = `
    <button class="btn btn-outline btn-small" id="prev-page" ${prevDisabled ? 'disabled' : ''}>← Prev</button>
    <span>Page ${page.pageNumber + 1} of ${Math.max(page.totalPages, 1)}</span>
    <button class="btn btn-outline btn-small" id="next-page" ${nextDisabled ? 'disabled' : ''}>Next →</button>
  `;
  if (!prevDisabled) el.querySelector('#prev-page').addEventListener('click', () => navigate(`/orders?page=${currentPage - 1}`));
  if (!nextDisabled) el.querySelector('#next-page').addEventListener('click', () => navigate(`/orders?page=${currentPage + 1}`));
}

export async function renderOrderDetail(container, params, id) {
  container.innerHTML = '<div class="spinner-row">Loading order…</div>';

  let order;
  try {
    order = await api.getMyOrder(id);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="title">Order not found</div><p>${escapeHtml(err.message)}</p></div>`;
    return;
  }

  draw(container, order);
}

function draw(container, order) {
  const canCancel = !['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.orderStatus);
  const addr = order.shippingAddress || {};

  container.innerHTML = `
    <a href="#/orders" class="link-btn" style="display:inline-block;margin-bottom:20px;">← Back to orders</a>
    <div class="two-col">
      <div>
        <h1 class="page-title" style="font-size:24px;">Order #${order.id}</h1>
        <p class="page-sub">Placed ${formatDate(order.createdAt)}</p>

        <h2 class="section-title">Items</h2>
        <div class="row-list">
          ${order.orderItems
            .map(
              (i) => `
            <div class="row-item">
              <div class="row-thumb"></div>
              <div class="row-info">
                <div class="name">${escapeHtml(i.productName)}</div>
                <div class="meta">Qty ${i.quantity} × ${formatMoney(i.priceAtPurchase)}</div>
              </div>
              <span class="ticket">${formatMoney(i.lineTotal)}</span>
            </div>`
            )
            .join('')}
        </div>

        <h2 class="section-title mt-16" style="margin-top:28px;">Shipping to</h2>
        <p class="muted" style="font-size:14px;">
          ${escapeHtml(addr.fullName || '')}<br/>
          ${escapeHtml(addr.addressLine1 || '')}${addr.addressLine2 ? ', ' + escapeHtml(addr.addressLine2) : ''}<br/>
          ${escapeHtml(addr.city || '')}, ${escapeHtml(addr.state || '')} ${escapeHtml(addr.postalCode || '')}<br/>
          ${escapeHtml(addr.country || '')} · ${escapeHtml(addr.phone || '')}
        </p>
      </div>
      <div class="summary-card">
        <h2 class="section-title">Status</h2>
        <div class="summary-line"><span>Order</span><span class="status-pill ${order.orderStatus}">${order.orderStatus}</span></div>
        <div class="summary-line"><span>Payment</span><span class="status-pill ${order.paymentStatus}">${order.paymentStatus}</span></div>
        <div class="summary-line total"><span>Total</span><span>${formatMoney(order.totalAmount)}</span></div>
        ${canCancel ? '<button class="btn btn-danger" style="width:100%;margin-top:12px;" id="cancel-order-btn">Cancel order</button>' : ''}
      </div>
    </div>
  `;

  const cancelBtn = container.querySelector('#cancel-order-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', async () => {
      if (!confirm('Cancel this order? Stock will be restored.')) return;
      cancelBtn.disabled = true;
      try {
        const updated = await api.cancelOrder(order.id);
        showToast('Order cancelled.', 'ok');
        draw(container, updated);
      } catch (err) {
        showToast(err.message, 'error');
        cancelBtn.disabled = false;
      }
    });
  }
}
