import { useState } from 'react';
import { reportAPI } from '../services/api';
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesReport, setSalesReport] = useState(null);
  const [stockReport, setStockReport] = useState(null);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);

  const formatRWF = (amount) =>
    new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(amount);

  const fetchSalesReport = async () => {
    setLoadingSales(true);
    try {
      const { data } = await reportAPI.dailySales(date);  // Fetch daily sales report
      setSalesReport(data);
      toast.success('Sales report generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally { setLoadingSales(false); }
  };

  const fetchStockReport = async () => {
    setLoadingStock(true);
    try {
      const { data } = await reportAPI.stockStatus();  // Fetch stock status report
      setStockReport(data);
      toast.success('Stock report generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally { setLoadingStock(false); }
  };

  const exportCSV = (rows, filename) => {
    const header = Object.keys(rows[0]).join(',');
    const csv = [header, ...rows.map((r) => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('CSV exported');
  };

  const exportPDF = (title, rows, columns) => {
    const win = window.open('', '_blank');
    const styles = `
      <style>
        body { font-family: -apple-system, system-ui, sans-serif; padding: 40px; color: #1f2937; }
        h1 { color: #111827; font-size: 24px; margin-bottom: 4px; }
        h2 { color: #6b7280; font-size: 14px; font-weight: 400; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #4f46e5; color: white; padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        tr:last-child td { border-bottom: none; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .card { background: #f9fafb; padding: 16px 20px; border-radius: 12px; flex: 1; }
        .card h3 { margin: 0 0 4px; color: #6b7280; font-size: 13px; font-weight: 500; }
        .card p { margin: 0; font-size: 22px; font-weight: 700; color: #111827; }
        .meta { color: #9ca3af; font-size: 12px; margin-top: 8px; }
      </style>
    `;
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>${styles}</head><body>`);
    win.document.write(`<h1>${title}</h1><h2>DAB Enterprise Ltd — Generated ${new Date().toLocaleDateString()}</h2>`);
    if (rows.length > 0) {
      win.document.write('<table><thead><tr>');
      columns.forEach((col) => win.document.write(`<th>${col}</th>`));
      win.document.write('</tr></thead><tbody>');
      rows.forEach((row) => {
        win.document.write('<tr>');
        columns.forEach((col) => win.document.write(`<td>${row[col] || ''}</td>`));
        win.document.write('</tr>');
      });
      win.document.write('</tbody></table>');
    } else {
      win.document.write('<p style="color: #9ca3af; margin-top: 40px;">No data available</p>');
    }
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  const tabs = [
    { id: 'sales', label: 'Daily Sales Report', icon: '💰' },
    { id: 'stock', label: 'Stock Status Report', icon: '📋' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and export business reports</p>
      </div>

      {/* Tab bar — stacks vertically on mobile (flex-col), row on sm: screens (sm:flex-row); full width on mobile, auto width on sm+ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex flex-col sm:flex-row w-full sm:w-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full sm:w-auto ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}>
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Section title — flexbox aligns accent bar and heading */}
          <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            Daily Sales Report
          </h2>
          {/* Controls — stacks vertically on mobile, row on sm: with bottom alignment */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all" />
            </div>
            {/* Generate button — flexbox centers icon and label */}
          <button onClick={fetchSalesReport} disabled={loadingSales}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-600/20 text-sm">
              {loadingSales && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {loadingSales ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          {salesReport ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-5 border border-indigo-100/50">
                  <p className="text-sm text-indigo-600 font-medium">Total Sales</p>
                  <p className="text-2xl font-bold text-indigo-900 mt-1">{formatRWF(salesReport.totalSales)}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-5 border border-emerald-100/50">
                  <p className="text-sm text-emerald-600 font-medium">Items Sold</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{salesReport.totalItems}</p>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl p-5 border border-violet-100/50">
                  <p className="text-sm text-violet-600 font-medium">Transactions</p>
                  <p className="text-2xl font-bold text-violet-900 mt-1">{salesReport.numberOfTransactions}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                      <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Unit Price</th>
                      <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {salesReport.sales.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center">
                          <p className="text-gray-400 font-medium">No sales for this date</p>
                        </td>
                      </tr>
                    ) : (
                      salesReport.sales.map((s) => (
                        <tr key={s._id} className="hover:bg-gray-50/60 even:bg-gray-50/30">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{s.product?.name || 'Deleted'}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.quantity}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatRWF((s.totalPrice || 0) / (s.quantity || 1))}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatRWF(s.totalPrice)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {salesReport.sales.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {/* Export PDF button — flexbox centers icon and label */}
                <button onClick={() => exportPDF('Daily Sales Report', salesReport.sales.map((s) => ({
                  'Product Name': s.product?.name || 'Deleted',
                  'Sold Qty': s.quantity,
                  'Unit Price': formatRWF((s.totalPrice || 0) / (s.quantity || 1)),
                  'Total Price': formatRWF(s.totalPrice),
                })), ['Product Name', 'Sold Qty', 'Unit Price', 'Total Price'])}
                  className="bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  Export PDF
                </button>
                {/* Export CSV button — flexbox centers icon and label */}
                <button onClick={() => exportCSV(salesReport.sales.map((s) => ({
                  'Product Name': s.product?.name || 'Deleted',
                  'Sold Qty': s.quantity,
                  'Unit Price': formatRWF((s.totalPrice || 0) / (s.quantity || 1)),
                  'Total Price': formatRWF(s.totalPrice),
                })), `sales-report-${salesReport.date}`)}
                  className="bg-white border-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Export CSV
                </button>
              </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50/50 rounded-xl">
              <div className="text-5xl mb-3 opacity-30">📊</div>
              <p className="text-gray-400 font-medium">No report generated yet</p>
              <p className="text-gray-300 text-sm mt-1">Select a date and click "Generate Report"</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Section title — flexbox aligns accent bar and heading */}
          <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            Stock Status Report
          </h2>
          {/* Generate button — flexbox centers icon and label */}
          <button onClick={fetchStockReport} disabled={loadingStock}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-600/20 text-sm mb-6">
            {loadingStock && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {loadingStock ? 'Generating...' : 'Generate Report'}
          </button>

          {stockReport ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-5 border border-emerald-100/50">
                  <p className="text-sm text-emerald-600 font-medium">In Stock</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{stockReport.inStock}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-5 border border-amber-100/50">
                  <p className="text-sm text-amber-600 font-medium">Low Stock</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{stockReport.lowStock}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-5 border border-red-100/50">
                  <p className="text-sm text-red-600 font-medium">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">{stockReport.outOfStock}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                      <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Stored Qty</th>
                      <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stockReport.stockStatuses.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-center">
                          <p className="text-gray-400 font-medium">No stock data available</p>
                        </td>
                      </tr>
                    ) : (
                      stockReport.stockStatuses.map((s) => (
                        <tr key={s._id} className="hover:bg-gray-50/60 even:bg-gray-50/30">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{s.product?.name || 'Deleted'}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.quantity}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                              s.status === 'inStock' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' :
                              s.status === 'lowStock' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                              'bg-red-50 text-red-700 ring-1 ring-red-200'
                            }`}>
                              {s.status === 'inStock' ? 'Good' : s.status === 'lowStock' ? 'Low Stock' : 'Out of Stock'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {stockReport.stockStatuses.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => exportPDF('Stock Status Report', stockReport.stockStatuses.map((s) => ({
                    'Product Name': s.product?.name || 'Deleted',
                    'Stored Qty': s.quantity,
                    Status: s.status === 'inStock' ? 'Good' : s.status === 'lowStock' ? 'Low Stock' : 'Out of Stock',
                  })), ['Product Name', 'Stored Qty', 'Status'])}
                    className="bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    Export PDF
                  </button>
                  <button onClick={() => exportCSV(stockReport.stockStatuses.map((s) => ({
                    'Product Name': s.product?.name || 'Deleted',
                    'Stored Qty': s.quantity,
                    Status: s.status === 'inStock' ? 'Good' : s.status === 'lowStock' ? 'Low Stock' : 'Out of Stock',
                  })), 'stock-report')}
                    className="bg-white border-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Export CSV
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50/50 rounded-xl">
              <div className="text-5xl mb-3 opacity-30">📋</div>
              <p className="text-gray-400 font-medium">No report generated yet</p>
              <p className="text-gray-300 text-sm mt-1">Click "Generate Report" to view stock status</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
