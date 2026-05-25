import { useState, useEffect, useMemo, useCallback } from 'react';
import { stockAPI, productAPI, saleAPI } from '../services/api';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

const StockPage = () => {
  const [stockItems, setStockItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ product: '', quantity: '' });
  const [editModal, setEditModal] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [editQuantity, setEditQuantity] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [stockRes, prodRes, saleRes] = await Promise.all([
        stockAPI.getAll(), productAPI.getAll(), saleAPI.getAll(),  // Fetch stock, products & sales
      ]);
      setStockItems(stockRes.data);
      setProducts(prodRes.data);
      setSales(saleRes.data);
    } catch (err) {
      toast.error('Failed to load stock data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const computeStockStats = useCallback((stockItem) => {
    const productSales = sales.filter((s) => (s.product?._id || s.product) === stockItem.product?._id);
    const soldQty = productSales.reduce((sum, s) => sum + s.quantity, 0);
    const available = stockItem.quantity || 0;
    return { available, soldQty, remaining: Math.max(0, available - soldQty) };
  }, [sales]);

  const enrichedItems = useMemo(() =>
    stockItems.map((item) => ({ ...item, stats: computeStockStats(item) })),
    [stockItems, computeStockStats]
  );

  const filtered = useMemo(() => {
    let list = enrichedItems.filter((item) => item.product?.name?.toLowerCase().includes(search.toLowerCase()));
    if (sortField) {
      list.sort((a, b) => {
        let aVal, bVal;
        if (sortField === 'productName') { aVal = a.product?.name; bVal = b.product?.name; }
        else if (sortField === 'available') { aVal = a.stats.available; bVal = b.stats.available; }
        else if (sortField === 'sold') { aVal = a.stats.soldQty; bVal = b.stats.soldQty; }
        else if (sortField === 'remaining') { aVal = a.stats.remaining; bVal = b.stats.remaining; }
        else if (sortField === 'status') { aVal = a.status; bVal = b.status; }
        else { aVal = a[sortField]; bVal = b[sortField]; }
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [enrichedItems, search, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!form.product) { toast.error('Please select a product'); return; }
    if (Number(form.quantity) < 0) { toast.error('Quantity cannot be negative'); return; }
    setSubmitting(true);
    try {
      await stockAPI.create({ product: form.product, quantity: Number(form.quantity), lowStockThreshold: 20 });  // Create stock status
      toast.success('Stock status added');
      setForm({ product: '', quantity: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add stock');
    } finally { setSubmitting(false); }
  };

  const handleEdit = async (id) => {
    if (Number(editQuantity) < 0) { toast.error('Invalid quantity'); return; }
    if (!editName.trim()) { toast.error('Product name is required'); return; }
    try {
      await stockAPI.update(id, {              // Update stock status
        quantity: Number(editQuantity),
        productName: editName.trim(),
        category: editCategory,
      });
      toast.success('Stock updated');
      setEditModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    try {
      await stockAPI.delete(id);  // Delete stock status
      toast.success('Stock status deleted');
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleView = async (id) => {
    try {
      const { data } = await stockAPI.getById(id);  // Fetch stock details
      setDetailModal(data);
    } catch (err) {
      toast.error('Failed to fetch details');
    }
  };

  const getStatusBadge = (remaining) => {
    if (remaining <= 0) return { label: 'Out of Stock', class: 'bg-red-50 text-red-700 ring-1 ring-red-200' };
    if (remaining <= 20) return { label: 'Low Stock', class: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' };
    return { label: 'Good', class: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' };
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1 opacity-0 group-hover:opacity-100">↕</span>;
    return <span className="text-indigo-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl w-48 animate-pulse" />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-gray-50 rounded-xl mb-3" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Stock Status</h1>
          <p className="text-sm text-gray-500 mt-1">{stockItems.length} product{stockItems.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-600/20 self-start text-sm">
          {showForm ? <><span className="text-lg leading-none">✕</span> Cancel</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add Stock</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />New Stock Entry
          </h2>
          <form onSubmit={handleAddStock} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product <span className="text-red-400">*</span></label>
              <select name="product" value={form.product} onChange={handleFormChange}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all bg-white" required>
                <option value="">-- Select Product --</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity <span className="text-red-400">*</span></label>
              <input type="number" min="0" name="quantity" value={form.quantity} onChange={handleFormChange} placeholder="0"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" required />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" disabled={submitting}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-600/20 text-sm">
                {submitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {submitting ? 'Saving...' : 'Add Stock Status'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-gray-100">
          <div className="relative max-w-md">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search products..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/80">
                {[
                  { key: 'productName', label: 'Product' },
                  { key: 'available', label: 'Available' },
                  { key: 'sold', label: 'Sold' },
                  { key: 'remaining', label: 'Remaining' },
                  { key: 'status', label: 'Status' },
                  { key: null, label: 'Actions' },
                ].map((col) => (
                  <th key={col.key || col.label}
                    className={`px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider ${col.key ? 'cursor-pointer hover:text-gray-600 group select-none' : ''}`}
                    onClick={() => col.key && handleSort(col.key)}>
                    <span className="inline-flex items-center gap-0.5">{col.label}{col.key && <SortIcon field={col.key} />}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="text-5xl mb-3 opacity-30">📋</div>
                    <p className="text-gray-400 font-medium">No stock data found</p>
                    <p className="text-gray-300 text-sm mt-1">Add stock status for your products</p>
                  </td>
                </tr>
              ) : (
                paginated.map((item) => {
                  const badge = getStatusBadge(item.stats.remaining);
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/60 transition-colors even:bg-gray-50/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{item.product?.name || 'Deleted'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.stats.available}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.stats.soldQty}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.stats.remaining}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${badge.class}`}>{badge.label}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setEditModal(item); setEditName(item.product?.name || ''); setEditCategory(item.product?.category || 'General'); setEditQuantity(item.stats.available); }}
                            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleView(item._id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="View">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => setDeleteConfirm(item)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next</button>
            </div>
          </div>
        )}
      </div>

      {editModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-[scaleIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />Edit Stock Item
            </h3>
            <p className="text-sm text-gray-500 mb-5">Update product details and quantity</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name <span className="text-red-400">*</span></label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all bg-white">
                  {['Electronics', 'Accessories', 'Computers', 'Phones', 'Others'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Quantity <span className="text-red-400">*</span></label>
                <input type="number" min="0" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" autoFocus />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditModal(null)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={() => handleEdit(editModal._id)} className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm font-medium hover:from-indigo-500 hover:to-indigo-600 transition-all shadow-lg shadow-indigo-600/20">Update</button>
            </div>
          </div>
        </div>
      )}

      {detailModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg animate-[scaleIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
              Stock Details
            </h3>
            <div className="space-y-3.5">
              {[
                { label: 'Product', value: detailModal.product?.name || 'N/A' },
                { label: 'Category', value: detailModal.product?.category || 'N/A' },
                { label: 'Available Quantity', value: detailModal.quantity },
                { label: 'Low Stock Threshold', value: detailModal.lowStockThreshold },
                { label: 'Status', value: null,
                  badge: detailModal.status === 'inStock' ? 'Good' : detailModal.status === 'lowStock' ? 'Low Stock' : 'Out of Stock',
                  badgeClass: detailModal.status === 'inStock' ? 'bg-emerald-50 text-emerald-700' : detailModal.status === 'lowStock' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700' },
                { label: 'Last Updated', value: new Date(detailModal.updatedAt).toLocaleString() },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  {row.badge ? (
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${row.badgeClass}`}>{row.badge}</span>
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{row.value}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setDetailModal(null)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-[scaleIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Confirm Delete</h3>
              <p className="text-sm text-gray-500">Are you sure you want to delete stock status for <strong className="text-gray-700">{deleteConfirm.product?.name}</strong>?</p>
            </div>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm._id)} className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl text-sm font-medium hover:from-red-500 hover:to-red-400 transition-all shadow-lg shadow-red-600/20">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockPage;
