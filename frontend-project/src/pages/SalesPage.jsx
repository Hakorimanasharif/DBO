import { useState, useEffect, useMemo, useCallback } from 'react';
import { saleAPI, productAPI } from '../services/api';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

const SalesPage = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ product: '', quantity: '', unitPrice: '', totalPrice: '0' });
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const selectedProduct = useMemo(() => products.find((p) => p._id === form.product), [products, form.product]);

  useEffect(() => {
    if (selectedProduct) {
      const qty = Number(form.quantity);
      const price = Number(form.unitPrice || selectedProduct.price);
      const total = qty * price;
      setForm((prev) => ({ ...prev, totalPrice: total > 0 ? total.toFixed(2) : '0', unitPrice: price }));
    }
  }, [form.product, form.quantity]);

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, salesRes] = await Promise.all([productAPI.getAll(), saleAPI.getAll()]);  // Fetch products & sales
      setProducts(productsRes.data);
      setSales(salesRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFormChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleProductSelect = (e) => {
    const pid = e.target.value;
    const prod = products.find((p) => p._id === pid);
    setForm({ product: pid, quantity: '', unitPrice: prod ? prod.price : '', totalPrice: '0' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product) { toast.error('Please select a product'); return; }
    const qty = Number(form.quantity);
    if (!qty || qty < 1) { toast.error('Quantity must be at least 1'); return; }
    if (selectedProduct && qty > (selectedProduct.stockQuantity || 0)) {
      toast.error(`Insufficient stock. Available: ${selectedProduct.stockQuantity}`);
      return;
    }
    setSubmitting(true);
    try {
      await saleAPI.create({ product: form.product, quantity: qty, customerName: '' });  // Record new sale
      toast.success('Sale recorded successfully');
      setForm({ product: '', quantity: '', unitPrice: '', totalPrice: '0' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record sale');
    } finally { setSubmitting(false); }
  };

  const todaySales = useMemo(() =>
    sales.filter((s) => new Date(s.saleDate).toISOString().split('T')[0] === saleDate),
    [sales, saleDate]
  );

  const filtered = useMemo(() => {
    let list = todaySales.filter((s) => s.product?.name?.toLowerCase().includes(search.toLowerCase()));
    if (sortField) {
      list.sort((a, b) => {
        let aVal = a[sortField], bVal = b[sortField];
        if (sortField === 'product') { aVal = a.product?.name; bVal = b.product?.name; }
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [todaySales, search, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const todayTotal = todaySales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const formatRWF = (amount) =>
    new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(amount);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1 opacity-0 group-hover:opacity-100">↕</span>;
    return <span className="text-indigo-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl w-48 animate-pulse" />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-50 rounded-xl mb-3" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales</h1>
          <p className="text-sm text-gray-500 mt-1">
            Today's revenue: <span className="font-semibold text-gray-800">{formatRWF(todayTotal)}</span>
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-600/20 self-start text-sm">
          {showForm ? (
            <><span className="text-lg leading-none">✕</span> Cancel</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> New Sale</>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            Record Sale
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product <span className="text-red-400">*</span></label>
              <select name="product" value={form.product} onChange={handleProductSelect}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all bg-white" required>
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} — Stock: {p.stockQuantity}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity <span className="text-red-400">*</span></label>
              <input type="number" min="1" name="quantity" value={form.quantity} onChange={handleFormChange} placeholder="0"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sales Date</label>
              <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit Price (RWF)</label>
              <input type="number" min="0" name="unitPrice" value={form.unitPrice} readOnly
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Price</label>
              <div className="px-3.5 py-2.5 border border-gray-200 rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                {form.totalPrice ? formatRWF(Number(form.totalPrice)) : 'RWF 0'}
              </div>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={submitting}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-600/20 text-sm">
                {submitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {submitting ? 'Saving...' : 'Record Sale'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search sales..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="text-gray-400">Date:</span>
            <input type="date" value={saleDate} onChange={(e) => { setSaleDate(e.target.value); setPage(1); }}
              className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/80">
                {[
                  { key: 'saleDate', label: 'Time' },
                  { key: 'product', label: 'Product' },
                  { key: 'quantity', label: 'Quantity' },
                  { key: null, label: 'Unit Price' },
                  { key: 'totalPrice', label: 'Total' },
                ].map((col) => (
                  <th key={col.key || col.label}
                    className={`px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider ${col.key ? 'cursor-pointer hover:text-gray-600 group select-none' : ''}`}
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
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="text-5xl mb-3 opacity-30">💰</div>
                    <p className="text-gray-400 font-medium">No sales for this date</p>
                    <p className="text-gray-300 text-sm mt-1">Select a different date or record a new sale</p>
                  </td>
                </tr>
              ) : (
                paginated.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/60 transition-colors even:bg-gray-50/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        {new Date(s.saleDate).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{s.product?.name || 'Deleted'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatRWF((s.totalPrice || 0) / (s.quantity || 1))}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatRWF(s.totalPrice)}</td>
                  </tr>
                ))
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
    </div>
  );
};

export default SalesPage;
