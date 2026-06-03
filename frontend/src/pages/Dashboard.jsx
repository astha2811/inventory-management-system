import { useEffect, useState } from 'react';
import { getDashboard } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(r => setStats(r.data))
      .catch(() => setError('Could not load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading dashboard…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Overview of your inventory system</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <>
          <div className="stat-grid">
            <div className="stat-card blue">
              <div className="stat-label">Total Products</div>
              <div className="stat-value">{stats.total_products}</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-label">Total Customers</div>
              <div className="stat-value">{stats.total_customers}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{stats.total_orders}</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-label">Low Stock Items</div>
              <div className="stat-value">{stats.low_stock_products.length}</div>
            </div>
          </div>

          {stats.low_stock_products.length > 0 && (
            <div className="card">
              <div className="section-header">
                <div className="section-title">⚠️ Low Stock Products (≤ 5 units)</div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.low_stock_products.map(p => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td><span className="mono">{p.sku}</span></td>
                        <td>${p.price.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${p.stock === 0 ? 'badge-red' : 'badge-orange'}`}>
                            {p.stock} left
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
