import { useState, useEffect, useMemo, useCallback } from 'react';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Electronics', quantity: '', unitPrice: '' });

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await productAPI.getAll();  // Fetch all products
      setProducts(data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => setForm({ name: '', category: 'Electronics', quantity: '', unitPrice: '' });

  const PRODUCT_NAME_REGEX = /^[a-zA-Z0-9\s\-'.,()]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) { toast.error('Product name is required'); return; }
    if (!PRODUCT_NAME_REGEX.test(name)) { toast.error('Special characters (!@#$%^*_+={}[]|\\:;"<>?~`) are not allowed in product name'); return; }
    const qty = Number(form.quantity);
    const price = Number(form.unitPrice);
    if (qty < 0) { toast.error('Quantity cannot be negative'); return; }
    if (price < 0) { toast.error('Unit price cannot be negative'); return; }
    if (products.some((p) => p.name.toLowerCase() === name.toLowerCase())) { toast.error('A product with this name already exists'); return; }
    setSubmitting(true);
    try {
      await productAPI.create({ name: form.name, category: form.category, stockQuantity: qty, price });  // Create new product
      toast.success('Product added successfully');
      resetForm();
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()));
    if (sortField) {
      list.sort((a, b) => {
        let aVal = a[sortField], bVal = b[sortField];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [products, search, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const formatRWF = (amount) =>
    new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(amount);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">↕</span>;
    return <span className="text-indigo-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl w-48 animate-pulse" />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 bg-gray-50 rounded-xl mb-3" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header — stacks vertically on mobile, row on sm: screens */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} product{products.length !== 1 ? 's' : ''} registered</p>
        </div>
        {/* Action button — flexbox centers icon and label */}
        <button onClick={() => { setShowForm(!showForm); resetForm(); }}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-600/20 self-start text-sm">
          {showForm ? (
            <><span className="text-lg leading-none">✕</span> Cancel</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add Product</>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Section title — flexbox row aligns accent bar and heading */}
          <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            New Product
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name <span className="text-red-400">*</span></label>
              <input name="name" value={form.name} onChange={handleFormChange} placeholder="Enter product name"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-400">*</span></label>
              <select name="category" value={form.category} onChange={handleFormChange}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all bg-white">
                {['Electronics', 'Accessories', 'Computers', 'Phones', 'Others'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity <span className="text-red-400">*</span></label>
              <input type="number" min="0" name="quantity" value={form.quantity} onChange={handleFormChange} placeholder="0"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit Price (RWF) <span className="text-red-400">*</span></label>
              <input type="number" min="0" step="0.01" name="unitPrice" value={form.unitPrice} onChange={handleFormChange} placeholder="0"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" required />
            </div>
            {/* Button row — stacks vertically on mobile, row on sm: screens */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:col-span-2 lg:col-span-4">
              <button type="submit" disabled={submitting}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 text-sm">
                {submitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {submitting ? 'Saving...' : 'Save Product'}
              </button>
              <button type="button" onClick={resetForm}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm">
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search bar — stacks vertically on mobile, row on sm: screens */}
        <div className="p-4 sm:px-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search products..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" />
          </div>
          <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/80">
                {[
                  { key: '_id', label: 'ID' },
                  { key: 'name', label: 'Product Name' },
                  { key: 'category', label: 'Category' },
                  { key: 'stockQuantity', label: 'Quantity' },
                  { key: 'price', label: 'Unit Price' },
                  { key: null, label: 'Total Price' },
                ].map((col) => (
                  <th key={col.key || col.label}
                    className={`px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider ${col.key ? 'cursor-pointer hover:text-gray-600 group select-none' : ''}`}
                    onClick={() => col.key && handleSort(col.key)}>
                    <span className="inline-flex items-center gap-0.5">
                      {col.label}
                      {col.key && <SortIcon field={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="text-5xl mb-3 opacity-30">📦</div>
                    <p className="text-gray-400 font-medium">No products found</p>
                    <p className="text-gray-300 text-sm mt-1">{search ? 'Try a different search' : 'Click "Add Product" to get started'}</p>
                  </td>
                </tr>
              ) : (
                paginated.map((p, idx) => (
                  <tr key={p._id} className="hover:bg-gray-50/60 transition-colors even:bg-gray-50/30">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">#{p._id.slice(-6)}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{p.name}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700">{p.category || 'General'}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.stockQuantity}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatRWF(p.price)}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatRWF((p.price || 0) * (p.stockQuantity || 0))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination — flexbox spaces page info left and buttons right */}
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
    </div>
  );
};

export default ProductsPage;
