import { useEffect, useState } from 'react';
import { getOrders, createOrder, deleteOrder, getProducts, getCustomers } from '../api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    Promise.all([getOrders(), getProducts(), getCustomers()])
      .then(([o, p, c]) => { setOrders(o.data); setProducts(p.data); setCustomers(c.data); })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const addItem = () => setItems([...items, { product_id: '', quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, key, val) => {
    const next = [...items];
    next[i] = { ...next[i], [key]: val };
    setItems(next);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    const validItems = items.filter(it => it.product_id && it.quantity > 0);
    if (!validItems.length) { setError('Add at least one product item.'); setSubmitting(false); return; }
    try {
      await createOrder({ customer_id: parseInt(customerId), items: validItems.map(it => ({ product_id: parseInt(it.product_id), quantity: parseInt(it.quantity) })) });
      setSuccess('Order created successfully.');
      setShowCreate(false);
      setCustomerId(''); setItems([{ product_id: '', quantity: 1 }]);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create order');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Cancel this order? Stock will be restored.')) return;
    try {
      await deleteOrder(id);
      setSuccess('Order cancelled.');
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cancel order');
    }
  };

  const statusBadge = (s) => {
    const map = { pending: 'badge-orange', completed: 'badge-green', cancelled: 'badge-red' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  if (loading) return <div className="loading"><div className="spinner" />Loading orders…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Orders</div>
          <div className="page-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''} total</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setError(''); setShowCreate(true); }}>+ New Order</button>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}
      {success && <div className="alert alert-success">✓ {success}</div>}

      <div className="card">
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <p>No orders yet. Create your first order.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><span className="mono badge badge-gray">#{o.id}</span></td>
                    <td style={{ fontWeight: 600 }}>{o.customer?.name || '—'}</td>
                    <td style={{ color: 'var(--text2)' }}>{o.items?.length || 0} item(s)</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>${o.total_amount.toFixed(2)}</td>
                    <td>{statusBadge(o.status)}</td>
                    <td style={{ color: 'var(--text2)' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-ghost btn-sm" onClick={() => setViewOrder(o)}>View</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(o.id)}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">New Order</div>
              <button className="close-btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">⚠ {error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>Customer *</label>
                <select required value={customerId} onChange={e => setCustomerId(e.target.value)}>
                  <option value="">Select a customer…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label>Order Items *</label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>+ Add Item</button>
              </div>

              <div className="order-items-builder">
                {items.map((item, i) => (
                  <div key={i} className="order-item-row">
                    <select
                      required
                      value={item.product_id}
                      onChange={e => updateItem(i, 'product_id', e.target.value)}
                    >
                      <option value="">Select product…</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ${p.price.toFixed(2)} (stock: {p.stock})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', e.target.value)}
                    />
                    {items.length > 1 && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>✕</button>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Placing…' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {viewOrder && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setViewOrder(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">Order #{viewOrder.id}</div>
              <button className="close-btn" onClick={() => setViewOrder(null)}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</div>
                <div style={{ fontWeight: 600 }}>{viewOrder.customer?.name}</div>
                <div style={{ color: 'var(--text2)', fontSize: 13 }}>{viewOrder.customer?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                <div>{viewOrder.status}</div>
                <div style={{ color: 'var(--text2)', fontSize: 13 }}>{new Date(viewOrder.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Product</th><th>SKU</th><th>Unit Price</th><th>Qty</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                  {viewOrder.items?.map(item => (
                    <tr key={item.id}>
                      <td>{item.product?.name || '—'}</td>
                      <td><span className="mono">{item.product?.sku || '—'}</span></td>
                      <td>${item.unit_price.toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td style={{ fontWeight: 600 }}>${(item.unit_price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'right', marginTop: 16, fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>
              Total: ${viewOrder.total_amount.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
